"""
Fix truncated commentaries in Pinecone.
Updates only the commentary field, preserving all other metadata including summaries.
"""
import os
import pickle
from dotenv import load_dotenv
from pinecone import Pinecone
from tqdm import tqdm

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))

embeddings_folder = 'embeddings'


def fix_commentaries():
    # Load verses with full commentary
    print("Loading verses...")
    with open(os.path.join(embeddings_folder, 'verses.pkl'), 'rb') as f:
        verses = pickle.load(f)

    print(f"Found {len(verses)} verses")

    # Count how many have truncated commentary
    truncated = sum(1 for v in verses if len(v['commentary']) > 1000)
    print(f"{truncated} verses have commentary > 1000 chars (currently truncated)")

    # Fetch existing vectors and update commentary
    updates = []
    for verse in tqdm(verses, desc="Preparing updates"):
        vector_id = f"ch{verse['chapter']}_v{verse['verse']}"

        # Fetch existing record to get current metadata
        result = index.fetch(ids=[vector_id])

        if vector_id not in result['vectors']:
            print(f"Warning: {vector_id} not found in Pinecone")
            continue

        existing = result['vectors'][vector_id]
        metadata = existing['metadata']

        # Update only the commentary field with full text
        metadata['commentary'] = verse['commentary']

        updates.append({
            "id": vector_id,
            "values": existing['values'],
            "metadata": metadata
        })

        # Upsert in batches of 50
        if len(updates) >= 50:
            index.upsert(vectors=updates)
            updates = []

    # Upload remaining
    if updates:
        index.upsert(vectors=updates)

    print("\nDone! All commentaries updated with full text.")

    # Verify a sample
    sample_id = "ch13_v8-12"  # One of the most truncated
    result = index.fetch(ids=[sample_id])
    if sample_id in result['vectors']:
        commentary_len = len(result['vectors'][sample_id]['metadata'].get('commentary', ''))
        print(f"Sample verification - {sample_id} commentary length: {commentary_len} chars")


if __name__ == "__main__":
    fix_commentaries()
