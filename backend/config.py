"""
Centralized configuration for GitaChat backend.
All environment variables and constants are defined here.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Limit CPU threads to prevent contention on shared infrastructure
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import torch
torch.set_num_threads(1)

# API Keys
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX")
GPT_KEY = os.getenv("GPT_KEY")

# Model configuration
EMBEDDING_MODEL_NAME = "BAAI/bge-base-en-v1.5"
EMBEDDING_DIMENSION = 768

# Processing constants
MAX_WORKERS = 10
BATCH_SIZE = 100

# Paths
EMBEDDINGS_FOLDER = "embeddings"
DATA_DIR = "data"
