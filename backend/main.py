from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

logging.basicConfig(level=logging.INFO)


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://gitachat.org"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    query: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/query", response_model=dict)
async def query_gita(query: Query) -> dict:
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