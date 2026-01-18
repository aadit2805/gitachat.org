"""
Script to find verses without commentary, generate summaries from translations,
and upload vectors to Pinecone.
"""

from pathlib import Path
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

from config import MAX_WORKERS, DATA_DIR
from clients import openai_client, index, embedding_model


def load_all_verses():
    """Load all verses from JSON files."""
    import json

    data_path = Path(DATA_DIR)
    verses = []
    for chapter_dir in sorted(data_path.iterdir()):
        if chapter_dir.is_dir():
            for verse_file in sorted(chapter_dir.glob("*.json")):
                with open(verse_file) as f:
                    verse = json.load(f)
                    verses.append(verse)
    return verses


def find_missing_commentary(verses):
    """Find verses with missing or empty commentary."""
    missing = []
    for verse in verses:
        commentary = verse.get("commentary", "").strip()
        if not commentary or len(commentary) < 10:
            missing.append(verse)
    return missing


def generate_summary_from_translation(verse):
    """Use GPT-4o-mini to generate a meaningful summary/commentary from the translation."""
    translation = verse.get("translation", "")
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """You are a scholar of the Bhagavad Gita. Given a verse translation,
provide a thoughtful commentary explaining its meaning, context, and spiritual significance.
Keep it concise but insightful (2-3 sentences).""",
            },
            {
                "role": "user",
                "content": f"Provide commentary for this Bhagavad Gita verse:\n\n{translation}",
            },
        ],
        max_tokens=300,
    )
    return {
        "chapter": verse["chapter"],
        "verse": verse["verse"],
        "translation": translation,
        "summary": response.choices[0].message.content.strip(),
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
        futures = {
            executor.submit(generate_summary_from_translation, v): v for v in missing
        }

        for future in tqdm(as_completed(futures), total=len(futures), desc="GPT calls"):
            original = futures[future]
            try:
                result = future.result()
                processed.append(result)
                print(f"\n  + Ch{result['chapter']} V{result['verse']}")
            except Exception as e:
                print(f"\n  x Ch{original['chapter']} V{original['verse']}: {e}")

    # Create vectors and upload using BGE model (768-dim)
    print("\nCreating embeddings with BGE model and uploading to Pinecone...")
    vectors = []

    for item in tqdm(processed, desc="Embedding"):
        text = f"{item['translation']} {item['summary']}"
        embedding = embedding_model.encode(text)

        vectors.append(
            {
                "id": f"ch{item['chapter']}_v{item['verse']}",
                "values": embedding.tolist(),
                "metadata": {
                    "chapter": item["chapter"],
                    "verse": item["verse"],
                    "translation": item["translation"][:1000],
                    "commentary": item["summary"][:1000],
                    "summary": item["summary"],
                },
            }
        )

    if vectors:
        index.upsert(vectors=vectors)
        print(f"Uploaded {len(vectors)} vectors to Pinecone")

    stats = index.describe_index_stats()
    print(f"\nPinecone index stats: {stats}")
    print("\nDone!")


if __name__ == "__main__":
    main()
