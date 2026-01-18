import os
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

load_dotenv()

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
old_index = pc.Index(os.getenv("PINECONE_INDEX"))  # gitachat (384-dim)
new_index = pc.Index(os.getenv("PINECONE_INDEX_V2"))  # gitachat-v2 (768-dim)

# New embedding model
print("Loading BGE embedding model...")
model = SentenceTransformer("BAAI/bge-base-en-v1.5")


def fetch_all_vectors():
    """Fetch all vectors from the old index."""
    print("Fetching all vectors from old index...")

    # Get all vector IDs by querying with a dummy vector
    stats = old_index.describe_index_stats()
    total_vectors = stats["total_vector_count"]
    print(f"Total vectors in old index: {total_vectors}")

    # Generate all possible IDs (18 chapters, ~47 verses max per chapter)
    all_ids = []
    for chapter in range(1, 19):
        for verse in range(1, 50):
            all_ids.append(f"ch{chapter}_v{verse}")

    # Fetch in batches of 100
    all_vectors = []
    batch_size = 100

    for i in tqdm(range(0, len(all_ids), batch_size), desc="Fetching vectors"):
        batch_ids = all_ids[i:i + batch_size]
        result = old_index.fetch(ids=batch_ids)

        for vector_id, vector_data in result.get("vectors", {}).items():
            all_vectors.append({
                "id": vector_id,
                "metadata": vector_data.get("metadata", {})
            })

    print(f"Fetched {len(all_vectors)} vectors")
    return all_vectors


def embed_and_upload(vectors):
    """Re-embed all vectors with BGE and upload to new index."""
    print("\nRe-embedding with BGE model and uploading to new index...")

    new_vectors = []

    for v in tqdm(vectors, desc="Embedding"):
        metadata = v["metadata"]

        # Combine translation and summary for embedding
        translation = metadata.get("translation", "")
        summary = metadata.get("summary", "")
        text_to_embed = f"{translation} {summary}"

        # BGE instruction prefix for documents
        text_with_instruction = f"Represent this document for retrieval: {text_to_embed}"

        # Generate new embedding
        embedding = model.encode(text_with_instruction).tolist()

        new_vectors.append({
            "id": v["id"],
            "values": embedding,
            "metadata": metadata  # Keep all existing metadata
        })

    # Upload in batches
    batch_size = 100
    for i in tqdm(range(0, len(new_vectors), batch_size), desc="Uploading to new index"):
        batch = new_vectors[i:i + batch_size]
        new_index.upsert(vectors=batch)

    print(f"\nSuccessfully uploaded {len(new_vectors)} vectors to new index!")

    # Verify
    stats = new_index.describe_index_stats()
    print(f"New index stats: {stats}")


def main():
    print("=" * 60)
    print("GitaChat Migration: 384-dim → 768-dim (BGE)")
    print("=" * 60)

    # Fetch all existing vectors with metadata
    vectors = fetch_all_vectors()

    if not vectors:
        print("No vectors found in old index!")
        return

    # Re-embed and upload
    embed_and_upload(vectors)

    print("\n" + "=" * 60)
    print("Migration complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
