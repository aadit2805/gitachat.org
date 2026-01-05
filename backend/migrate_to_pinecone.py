import os
import pickle
from dotenv import load_dotenv
from pinecone import Pinecone
from tqdm import tqdm

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))

embeddings_folder = 'embeddings'

def migrate():
    # Load existing embeddings
    print("Loading existing embeddings...")
    with open(os.path.join(embeddings_folder, 'embeddings.pkl'), 'rb') as f:
        embeddings = pickle.load(f)
    with open(os.path.join(embeddings_folder, 'verses.pkl'), 'rb') as f:
        verses = pickle.load(f)

    print(f"Found {len(verses)} verses to upload")

    # Prepare vectors for upsert
    vectors = []
    for i, (verse, embedding) in enumerate(tqdm(zip(verses, embeddings), total=len(verses))):
        vector_id = f"ch{verse['chapter']}_v{verse['verse']}"

        vectors.append({
            "id": vector_id,
            "values": embedding.tolist(),
            "metadata": {
                "chapter": verse['chapter'],
                "verse": verse['verse'],
                "translation": verse['translation'][:1000],  # Pinecone metadata limit
                "commentary": verse['commentary'][:1000]
            }
        })

    # Upsert in batches of 100
    batch_size = 100
    for i in tqdm(range(0, len(vectors), batch_size), desc="Uploading to Pinecone"):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch)

    print(f"Successfully uploaded {len(vectors)} verses to Pinecone!")

    # Verify
    stats = index.describe_index_stats()
    print(f"Index stats: {stats}")

if __name__ == "__main__":
    migrate()
