"""
Precompute summaries for all verses and upload to Pinecone.
"""

from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

from config import MAX_WORKERS, BATCH_SIZE
from clients import index, embedding_model
from utils import summarize, load_verses_from_pickle


def process_verse(verse, embedding):
    """Process a single verse: generate summary and prepare vector."""
    vector_id = f"ch{verse['chapter']}_v{verse['verse']}"
    summary = summarize(verse["commentary"])
    return {
        "id": vector_id,
        "values": embedding.tolist(),
        "metadata": {
            "chapter": verse["chapter"],
            "verse": verse["verse"],
            "translation": verse["translation"],
            "commentary": verse["commentary"],
            "summary": summary,
        },
    }


def precompute():
    print("Loading existing embeddings and verses...")
    verses, embeddings = load_verses_from_pickle()

    print(f"Found {len(verses)} verses to process")
    print(f"Processing with {MAX_WORKERS} parallel threads...")

    vectors = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(process_verse, verse, emb): i
            for i, (verse, emb) in enumerate(zip(verses, embeddings))
        }

        for future in tqdm(as_completed(futures), total=len(futures)):
            try:
                vector = future.result()
                vectors.append(vector)

                # Upload in batches
                if len(vectors) >= BATCH_SIZE:
                    index.upsert(vectors=vectors)
                    vectors = []
            except Exception as e:
                print(f"Error: {e}")

    # Upload remaining
    if vectors:
        index.upsert(vectors=vectors)

    print("\nDone! All summaries pre-computed and uploaded to Pinecone.")
    stats = index.describe_index_stats()
    print(f"Index stats: {stats}")


if __name__ == "__main__":
    precompute()
