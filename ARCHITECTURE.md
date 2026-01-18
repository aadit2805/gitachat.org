# GitaChat Architecture

A spiritual guidance app that uses semantic search to find relevant Bhagavad Gita verses based on user questions.

## Tech Stack

### Backend (Python/FastAPI)
- **FastAPI** - REST API framework
- **Pinecone** - Vector database for semantic search
- **OpenAI** - GPT-4o-mini for commentary summarization
- **Sentence Transformers** - BGE-base-en-v1.5 (768-dim) for embeddings
- **SlowAPI** - Rate limiting

### Frontend (Next.js)
- **Next.js 15** - React framework with App Router
- **TanStack Query** - Data fetching and caching
- **Clerk** - Authentication
- **Supabase** - Database for user data (bookmarks, history, notes)
- **Tailwind CSS** - Styling
- **Replicate** - AI image generation

---

## Backend Structure

```
backend/
├── config.py              # Centralized configuration and environment variables
├── clients.py             # Shared client initializations (Pinecone, OpenAI, embedding model)
├── utils.py               # Shared utility functions (summarize, load_verses, batch_upsert)
├── model.py               # Core search functionality (match, get_verse)
├── main.py                # FastAPI application and endpoints
├── fill_missing_commentary.py  # Script to fill missing commentaries
├── precompute_summaries.py     # Script to precompute verse summaries
├── scrape.py              # Data scraping utilities
├── translate.py           # Translation utilities
├── data/                  # JSON verse data by chapter
├── embeddings/            # Pickle files for embeddings and verses
└── archive/               # One-time migration scripts (historical)
```

### Shared Modules

**config.py** - All environment variables and constants:
- `PINECONE_API_KEY`, `PINECONE_INDEX`, `GPT_KEY`
- `EMBEDDING_MODEL_NAME = "BAAI/bge-base-en-v1.5"`
- `EMBEDDING_DIMENSION = 768`
- `MAX_WORKERS = 10`, `BATCH_SIZE = 100`

**clients.py** - Single instance initializations:
- `pc` / `index` - Pinecone client and index
- `openai_client` - OpenAI client
- `embedding_model` - SentenceTransformer with BGE

**utils.py** - Shared functions:
- `summarize(text)` - Generate GPT summary
- `load_verses_from_pickle()` - Load verses and embeddings
- `batch_upsert(vectors)` - Upload to Pinecone in batches

---

## Frontend Structure

```
frontend/app/
├── lib/
│   ├── types.ts           # Consolidated type definitions
│   ├── chapters.ts        # Chapter data and helper functions
│   ├── constants.ts       # Centralized constants (localStorage keys, stale times)
│   ├── utils.tsx          # Utility functions (cn, renderMarkdown)
│   ├── supabase.ts        # Supabase client and types
│   └── ...
├── components/
│   ├── VerseDisplay.tsx   # Reusable verse display component
│   ├── PageLoading.tsx    # Shared loading state component
│   ├── PageError.tsx      # Shared error state component
│   ├── VerseActions.tsx   # Bookmark, share, visualize actions
│   ├── ExpandableCommentary.tsx
│   ├── BackToSearch.tsx
│   ├── Nav.tsx
│   └── ...
├── page.tsx               # Home page (search)
├── daily/page.tsx         # Daily verse page
├── saved/page.tsx         # Saved bookmarks
├── history/page.tsx       # Query history
├── read/page.tsx          # Chapter list
├── read/[chapter]/page.tsx # Chapter reader
├── verse/[chapter]/[verse]/page.tsx # Individual verse page
└── api/                   # API routes
```

### Shared Types (lib/types.ts)

```typescript
export interface VerseData {
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
  full_commentary?: string;
  related?: RelatedVerse[];
}

export interface Bookmark {
  id: string;
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
  created_at: string;
}

export interface SavedSearch {
  query: string;
  result: VerseData;
}

export interface GeneratedImage {
  imageUrl: string;
  shareUrl: string;
  cached: boolean;
}
```

### Chapter Data (lib/chapters.ts)

- `CHAPTERS` - Full chapter list with names, verse counts, summaries
- `VERSES_PER_CHAPTER` - Quick lookup for verse counts
- `getChapter(num)`, `getVerseCount(num)`, `getAdjacentVerses(ch, v)`
- `isValidVerse(chapter, verse)` - Validation helper

### Constants (lib/constants.ts)

```typescript
export const LAST_SEARCH_KEY = "gitachat_last_search";
export const STALE_TIME = {
  BOOKMARKS: 30 * 1000,
  HISTORY: 30 * 1000,
  DAILY_VERSE: 5 * 60 * 1000,
  ALL_VERSES: 60 * 60 * 1000,
  VERSE: 5 * 60 * 1000,
};
```

---

## API Endpoints

### Backend (FastAPI)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/query` | Semantic search for verses |
| POST | `/api/verse` | Get specific verse by chapter/verse |
| GET | `/api/all-verses` | Get all verses for client-side search |

### Frontend API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api` | Proxy to backend query |
| POST | `/api/verse` | Proxy to backend verse |
| GET | `/api/all-verses` | Proxy to backend all-verses |
| GET/POST/DELETE | `/api/bookmarks` | User bookmarks (Supabase) |
| GET/DELETE | `/api/history` | Query history (Supabase) |
| GET/POST/DELETE | `/api/notes` | User notes (Supabase) |
| GET | `/api/daily` | Daily verse |
| POST | `/api/generate-image` | AI image generation |
| POST | `/api/email-subscription` | Email subscription |
| POST | `/api/daily-email` | Send daily email |
| GET | `/api/unsubscribe` | Unsubscribe from emails |

---

## Database Schema (Supabase)

### query_history
- `id` (uuid, PK)
- `user_id` (text)
- `query` (text)
- `chapter` (int)
- `verse` (int)
- `translation` (text)
- `summarized_commentary` (text)
- `created_at` (timestamp)

### bookmarks
- `id` (uuid, PK)
- `user_id` (text)
- `chapter` (int)
- `verse` (int)
- `translation` (text)
- `summarized_commentary` (text)
- `created_at` (timestamp)

### verse_notes
- `id` (uuid, PK)
- `user_id` (text)
- `chapter` (int)
- `verse` (int)
- `content` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### email_subscribers
- `id` (uuid, PK)
- `user_id` (text)
- `email` (text)
- `timezone` (text)
- `unsubscribe_token` (text)
- `is_active` (boolean)
- `last_email_sent_at` (timestamp)
- `subscribed_at` (timestamp)
- `created_at` (timestamp)

### verse_images
- `id` (uuid, PK)
- `chapter` (int)
- `verse` (int)
- `image_url` (text)
- `storage_path` (text)
- `prompt_hash` (text)
- `user_id` (text, nullable)
- `created_at` (timestamp)

---

## Environment Variables

### Backend
- `PINECONE_API_KEY` - Pinecone API key
- `PINECONE_INDEX` - Pinecone index name
- `GPT_KEY` - OpenAI API key

### Frontend
- `BACKEND_URL` - Backend API URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_CLERK_*` - Clerk authentication keys
- `REPLICATE_API_TOKEN` - Replicate API token
- `RESEND_API_KEY` - Resend email API key

---

## Data Flow

1. **Search Query**
   - User enters question on home page
   - Frontend calls `/api` which proxies to backend `/api/query`
   - Backend encodes query with BGE model, queries Pinecone
   - Applies hybrid search (semantic + keyword boost)
   - Returns best match + 3 related verses
   - Query saved to history (Supabase)

2. **Verse Display**
   - Multiple pages display verses using shared `VerseDisplay` component
   - Actions (bookmark, share, visualize) via `VerseActions`
   - Expandable commentary with full text on demand

3. **Daily Verse**
   - Deterministic verse selection based on date + timezone
   - Same verse for all users in same timezone on same day
   - Optional email subscription for daily delivery
