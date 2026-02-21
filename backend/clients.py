"""
Shared client initializations for GitaChat backend.
Centralizes Pinecone, OpenAI, and SentenceTransformer clients.
"""

from config import (
    PINECONE_API_KEY,
    PINECONE_INDEX,
    GPT_KEY,
    EMBEDDING_MODEL_NAME,
)
from pinecone import Pinecone
from openai import OpenAI
from sentence_transformers import SentenceTransformer

# Pinecone client and index
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX)

# OpenAI client with timeout
openai_client = OpenAI(api_key=GPT_KEY, timeout=30.0)

# Embedding model - BGE base (768-dim, top MTEB performance)
embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
