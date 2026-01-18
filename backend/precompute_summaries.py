import os
import pickle
from dotenv import load_dotenv
from pinecone import Pinecone
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

client = OpenAI(api_key=os.getenv("GPT_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))
model = SentenceTransformer('all-MiniLM-L6-v2')

embeddings_folder = 'embeddings'

def summarize(commentary_text):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that summarizes text concisely but completely."},
            {"role": "user", "content": f"Summarize the following commentary: {commentary_text}"}
        ],
        max_tokens=500
    )
    return response.choices[0].message.content.strip()

def process_verse(verse, embedding):
    vector_id = f"ch{verse['chapter']}_v{verse['verse']}"
    summary = summarize(verse['commentary'])
    return {
        "id": vector_id,
        "values": embedding.tolist(),
        "metadata": {
            "chapter": verse['chapter'],
            "verse": verse['verse'],
            "translation": verse['translation'],
            "commentary": verse['commentary'],
            "summary": summary
        }
    }

def precompute():
    print("Loading existing embeddings and verses...")
    with open(os.path.join(embeddings_folder, 'embeddings.pkl'), 'rb') as f:
        embeddings = pickle.load(f)
    with open(os.path.join(embeddings_folder, 'verses.pkl'), 'rb') as f:
        verses = pickle.load(f)

    print(f"Found {len(verses)} verses to process")
    print("Processing with 10 parallel threads...")

    vectors = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(process_verse, verse, emb): i
            for i, (verse, emb) in enumerate(zip(verses, embeddings))
        }

        for future in tqdm(as_completed(futures), total=len(futures)):
            try:
                vector = future.result()
                vectors.append(vector)

                # Upload in batches of 100
                if len(vectors) >= 100:
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
