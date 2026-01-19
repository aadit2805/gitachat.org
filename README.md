# GitaChat
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/aadit2805/gitachat.org)

Ask a question. Receive guidance from the Bhagavad Gita.

GitaChat uses semantic search to find the most relevant verse from the Bhagavad Gita's 700 verses based on your question.

## Tech Stack

**Frontend**
- Next.js + TypeScript
- Tailwind CSS
- TanStack Query
- Clerk (auth)
- Supabase (query history)
- Hosted on Vercel

**Backend**
- Python + FastAPI
- Sentence Transformers (BGE-base-en-v1.5, 768-dim)
- Pinecone (vector DB)
- Hosted on Railway

## How It Works

1. Your question gets converted into a vector embedding
2. We search Pinecone for the most similar verse
3. Return the verse with additional commentary that best suits your query

## Local Development

**Frontend**
```bash
cd frontend
bun install
bun run dev
```

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Environment Variables

**Frontend** (`frontend/.env.local`)
```
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

**Backend** (`backend/.env`)
```
PINECONE_API_KEY=
PINECONE_INDEX=
GPT_KEY=
```
