"""
Upload missing verses to Pinecone.
These verses exist in the pickle files but were never uploaded.
"""
import os
import pickle
from dotenv import load_dotenv
from pinecone import Pinecone
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

load_dotenv()

client = OpenAI(api_key=os.getenv("GPT_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))

# Use the same model as model.py (768-dim)
embedding_model = SentenceTransformer("BAAI/bge-base-en-v1.5")

embeddings_folder = 'embeddings'


def summarize(commentary_text):
    """Generate a summary of the commentary using GPT-4o-mini."""
    if not commentary_text or len(commentary_text) < 10:
        return ""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that summarizes text concisely but completely."},
            {"role": "user", "content": f"Summarize the following commentary: {commentary_text}"}
        ],
        max_tokens=500
    )
    return response.choices[0].message.content.strip()


def upload_missing():
    # Load verses and embeddings
    print("Loading verses and embeddings...")
    with open(os.path.join(embeddings_folder, 'embeddings.pkl'), 'rb') as f:
        embeddings = pickle.load(f)
    with open(os.path.join(embeddings_folder, 'verses.pkl'), 'rb') as f:
        verses = pickle.load(f)

    print(f"Total verses in pickle: {len(verses)}")

    # Find missing verses
    missing = []
    for i, verse in enumerate(verses):
        vector_id = f"ch{verse['chapter']}_v{verse['verse']}"
        result = index.fetch(ids=[vector_id])
        if vector_id not in result['vectors']:
            missing.append((i, verse))

    print(f"Found {len(missing)} missing verses")

    if not missing:
        print("No missing verses to upload!")
        return

    # Upload missing verses
    vectors = []
    for i, verse in tqdm(missing, desc="Processing missing verses"):
        vector_id = f"ch{verse['chapter']}_v{verse['verse']}"

        # Generate embedding using BGE model (768-dim)
        text_to_embed = f"{verse['translation']} {verse['commentary']}"
        embedding = embedding_model.encode(text_to_embed)

        # Generate summary
        summary = summarize(verse['commentary'])

        vectors.append({
            "id": vector_id,
            "values": embedding.tolist(),
            "metadata": {
                "chapter": verse['chapter'],
                "verse": verse['verse'],
                "translation": verse['translation'],
                "commentary": verse['commentary'],
                "summary": summary
            }
        })

        # Upsert in batches of 10
        if len(vectors) >= 10:
            index.upsert(vectors=vectors)
            vectors = []

    # Upload remaining
    if vectors:
        index.upsert(vectors=vectors)

    print(f"\nDone! Uploaded {len(missing)} missing verses.")

    # Verify
    stats = index.describe_index_stats()
    print(f"Index stats: {stats}")


if __name__ == "__main__":
    upload_missing()
