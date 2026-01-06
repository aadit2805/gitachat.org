"""
Script to find verses without commentary, generate summaries from translations,
and upload vectors to Pinecone.
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
from pinecone import Pinecone
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Initialize clients
client = OpenAI(api_key=os.getenv("GPT_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))

DATA_DIR = Path('data')
MAX_WORKERS = 5


def load_all_verses():
    """Load all verses from JSON files."""
    verses = []
    for chapter_dir in sorted(DATA_DIR.iterdir()):
        if chapter_dir.is_dir():
            for verse_file in sorted(chapter_dir.glob('*.json')):
                with open(verse_file) as f:
                    verse = json.load(f)
                    verses.append(verse)
    return verses


def find_missing_commentary(verses):
    """Find verses with missing or empty commentary."""
    missing = []
    for verse in verses:
        commentary = verse.get('commentary', '').strip()
        if not commentary or len(commentary) < 10:
            missing.append(verse)
    return missing


def generate_summary_from_translation(verse):
    """Use GPT-4o-mini to generate a meaningful summary/commentary from the translation."""
    translation = verse.get('translation', '')
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """You are a scholar of the Bhagavad Gita. Given a verse translation,
provide a thoughtful commentary explaining its meaning, context, and spiritual significance.
Keep it concise but insightful (2-3 sentences)."""
            },
            {
                "role": "user",
                "content": f"Provide commentary for this Bhagavad Gita verse:\n\n{translation}"
            }
        ],
        max_tokens=300
    )
    return {
        'chapter': verse['chapter'],
        'verse': verse['verse'],
        'translation': translation,
        'summary': response.choices[0].message.content.strip()
    }


def main():
    print("Loading all verses from JSON files...")
    all_verses = load_all_verses()
    print(f"Total verses: {len(all_verses)}")

    print("\nFinding verses without commentary...")
    missing = find_missing_commentary(all_verses)
    print(f"Verses missing commentary: {len(missing)}")

    if not missing:
        print("All verses have commentary. Nothing to do.")
        return

    print("\nVerses to process:")
    for v in missing:
        print(f"  Chapter {v['chapter']}, Verse {v['verse']}")

    # Generate summaries in parallel
    print(f"\nGenerating summaries with {MAX_WORKERS} parallel workers...")
    processed = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(generate_summary_from_translation, v): v for v in missing}

        for future in tqdm(as_completed(futures), total=len(futures), desc="GPT calls"):
            original = futures[future]
            try:
                result = future.result()
                processed.append(result)
                print(f"\n  ✓ Ch{result['chapter']} V{result['verse']}")
            except Exception as e:
                print(f"\n  ✗ Ch{original['chapter']} V{original['verse']}: {e}")

    # Load embedding model after GPT calls (to avoid threading issues)
    print("\nLoading embedding model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # Create vectors and upload
    print("\nCreating embeddings and uploading to Pinecone...")
    vectors = []

    for item in tqdm(processed, desc="Embedding"):
        text = f"{item['translation']} {item['summary']}"
        embedding = model.encode(text)

        vectors.append({
            "id": f"ch{item['chapter']}_v{item['verse']}",
            "values": embedding.tolist(),
            "metadata": {
                "chapter": item['chapter'],
                "verse": item['verse'],
                "translation": item['translation'][:1000],
                "commentary": item['summary'][:1000],
                "summary": item['summary']
            }
        })

    if vectors:
        index.upsert(vectors=vectors)
        print(f"Uploaded {len(vectors)} vectors to Pinecone")

    stats = index.describe_index_stats()
    print(f"\nPinecone index stats: {stats}")
    print("\nDone!")


if __name__ == "__main__":
    main()
