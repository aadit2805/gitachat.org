"""
Shared utility functions for GitaChat backend.
"""

import os
import pickle
from pathlib import Path
from config import EMBEDDINGS_FOLDER, BATCH_SIZE
from clients import openai_client, index


def summarize(commentary_text: str) -> str:
    """Generate a summary of the commentary using GPT-4o-mini."""
    if not commentary_text or len(commentary_text) < 10:
        return ""

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that summarizes text concisely but completely.",
            },
            {
                "role": "user",
                "content": f"Summarize the following commentary: {commentary_text}",
            },
        ],
        max_tokens=500,
    )
    return response.choices[0].message.content.strip()


def load_verses_from_pickle():
    """Load verses and embeddings from pickle files."""
    with open(os.path.join(EMBEDDINGS_FOLDER, "verses.pkl"), "rb") as f:
        verses = pickle.load(f)
    with open(os.path.join(EMBEDDINGS_FOLDER, "embeddings.pkl"), "rb") as f:
        embeddings = pickle.load(f)
    return verses, embeddings


def load_verses_from_json(data_dir: str = "data"):
    """Load all verses from JSON files in the data directory."""
    import json

    data_path = Path(data_dir)
    verses = []
    for chapter_dir in sorted(data_path.iterdir()):
        if chapter_dir.is_dir():
            for verse_file in sorted(chapter_dir.glob("*.json")):
                with open(verse_file) as f:
                    verse = json.load(f)
                    verses.append(verse)
    return verses


def batch_upsert(vectors: list, batch_size: int = BATCH_SIZE):
    """Upload vectors to Pinecone in batches."""
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        index.upsert(vectors=batch)
