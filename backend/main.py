from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import match
import logging


logging.basicConfig(level=logging.INFO)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://gitachat.org"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    query: str

@app.post("/api/query", response_model=dict)
async def query_gita(query: Query) -> dict:
    """
    Query the Gita with the provided query string(s).
    """
    try:
        result = match(query.query)
        if not result:  
            raise HTTPException(status_code=404, detail="No matches found")
        return {"status": "success", "data": result}
    except Exception as e:
        logging.error(f"Error occurred: {str(e)}")  
        raise HTTPException(status_code=500, detail="Internal Server Error")