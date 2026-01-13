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


@asynccontextmanager
async def lifespan(app: FastAPI):
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