from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import logging
import json
import os

logging.basicConfig(level=logging.INFO)

limiter = Limiter(key_func=get_remote_address)

MAX_QUERY_LENGTH = 500

# Cache for all verses (loaded once on startup)
all_verses_cache: list[dict] = []


def load_all_verses() -> list[dict]:
    """Load all verses from JSON files in backend/data/"""
    verses = []
    data_dir = os.path.join(os.path.dirname(__file__), "data")

    for chapter_num in range(1, 19):  # Chapters 1-18
        chapter_dir = os.path.join(data_dir, f"chapter_{chapter_num}")
        if not os.path.exists(chapter_dir):
            continue

        verse_num = 1
        while True:
            verse_file = os.path.join(chapter_dir, f"verse_{verse_num}.json")
            if not os.path.exists(verse_file):
                break

            with open(verse_file, "r", encoding="utf-8") as f:
                verse_data = json.load(f)
                verses.append({
                    "chapter": verse_data["chapter"],
                    "verse": verse_data["verse"],
                    "translation": verse_data["translation"],
                    "summary": verse_data.get("commentary", "")[:500]  # Truncate for search
                })
            verse_num += 1

    return verses


@asynccontextmanager
async def lifespan(app: FastAPI):
    global all_verses_cache
    # Load all verses on startup
    logging.info("Loading all verses...")
    all_verses_cache = load_all_verses()
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