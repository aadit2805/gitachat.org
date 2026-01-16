from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import logging

logging.basicConfig(level=logging.INFO)

limiter = Limiter(key_func=get_remote_address)

MAX_QUERY_LENGTH = 500

# Cache for all verses (loaded once on startup)
all_verses_cache: list[dict] = []


def load_all_verses_from_pinecone() -> list[dict]:
    """Load all verses from Pinecone vector database"""
    from model import index

    verses = []
    # Pinecone doesn't have a "fetch all" - we query with a dummy vector and high top_k
    # Since we have ~700 verses, we fetch in batches by chapter
    for chapter_num in range(1, 19):
        results = index.query(
            vector=[0] * 768,
            top_k=100,  # Max verses per chapter is 78 (chapter 18)
            include_metadata=True,
            filter={"chapter": chapter_num}
        )

        for match in results["matches"]:
            meta = match["metadata"]
            verses.append({
                "chapter": meta["chapter"],
                "verse": meta["verse"],
                "translation": meta["translation"],
                "summary": meta.get("summary", "")[:500]
            })

    # Sort by chapter and verse
    verses.sort(key=lambda v: (v["chapter"], v["verse"]))
    return verses


@asynccontextmanager
async def lifespan(app: FastAPI):
    global all_verses_cache
    # Load all verses from Pinecone on startup
    logging.info("Loading all verses from Pinecone...")
    all_verses_cache = load_all_verses_from_pinecone()
    logging.info(f"Loaded {len(all_verses_cache)} verses")

    # Load model on startup (before any requests)
    logging.info("Loading embedding model...")
    from model import embedding_model
    # Warm up the model with a dummy query
    embedding_model.encode("warmup")
    logging.info("Model loaded and ready!")
    yield


app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://gitachat.org"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=429, content={"error": "Too many requests"})


class Query(BaseModel):
    query: str = Field(..., min_length=1, max_length=MAX_QUERY_LENGTH)


class VerseRequest(BaseModel):
    chapter: int = Field(..., ge=1, le=18)
    verse: int = Field(..., ge=1)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/query", response_model=dict)
@limiter.limit("30/minute")
async def query_gita(request: Request, query: Query) -> dict:
    """
    Query the Gita with the provided query string(s).
    """
    try:
        from model import match
        result = match(query.query)
        if not result:
            raise HTTPException(status_code=404, detail="No matches found")
        return {"status": "success", "data": result}
    except Exception as e:
        logging.error(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.post("/api/verse", response_model=dict)
@limiter.limit("30/minute")
async def get_specific_verse(request: Request, verse_req: VerseRequest) -> dict:
    """
    Get a specific verse by chapter and verse number.
    """
    try:
        from model import get_verse
        result = get_verse(verse_req.chapter, verse_req.verse)
        if not result:
            raise HTTPException(status_code=404, detail="Verse not found")
        return {"status": "success", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching verse: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.get("/api/all-verses")
async def get_all_verses():
    """
    Get all verses for client-side search.
    Returns chapter, verse, translation, and summary for all 703 verses.
    """
    return {"status": "success", "data": all_verses_cache}