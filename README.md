# GitaChat

Ask a question. Receive guidance from the Bhagavad Gita.

GitaChat uses semantic search to find the most relevant verse from the Bhagavad Gita's 700 verses based on your question.

## Tech Stack

**Frontend**
- Next.js + TypeScript
- Tailwind CSS
- Clerk (auth)
- Supabase (query history)
- Hosted on Vercel

**Backend**
- Python + FastAPI
- Sentence Transformers (BGE embeddings)
- Pinecone (vector database)
- Hosted on Railway

## How It Works

1. Your question gets converted into a vector embedding
2. We search Pinecone for the most similar verse
3. Return the verse with a pre-computed GPT summary

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
```

**Backend** (`backend/.env`)
```
PINECONE_API_KEY=
PINECONE_INDEX=
GPT_KEY=
```
