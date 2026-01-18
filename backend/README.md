# GitaChat Backend

FastAPI backend for semantic verse search using Pinecone and BGE embeddings.

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file:
```
PINECONE_API_KEY=your_key
PINECONE_INDEX=gitachat-v2
GPT_KEY=your_openai_key
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

## Project Structure

- `config.py` - Environment variables and constants
- `clients.py` - Shared Pinecone, OpenAI, and embedding model instances
- `utils.py` - Shared utilities (summarize, load_verses, batch_upsert)
- `model.py` - Core search functions (match, get_verse)
- `main.py` - FastAPI endpoints
- `archive/` - One-time migration scripts (historical)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/query` | Semantic search for verses |
| POST | `/api/verse` | Get specific verse by chapter/verse |
| GET | `/api/all-verses` | Get all verses for client-side search |
