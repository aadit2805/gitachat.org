import os
from dotenv import load_dotenv

load_dotenv()

from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Embedding model - bge-base-en-v1.5 (768-dim, top MTEB performance)
embedding_model = SentenceTransformer("BAAI/bge-base-en-v1.5")

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))


def match(query):
    # BGE models work best with instruction prefix for queries
    query_with_instruction = f"Represent this sentence for searching relevant passages: {query}"
    query_embedding = embedding_model.encode(query_with_instruction).tolist()

    # Fetch best match from Pinecone
    results = index.query(
        vector=query_embedding,
        top_k=1,
        include_metadata=True
    )

    if not results["matches"]:
        return None

    metadata = results["matches"][0]["metadata"]

    return {
        "chapter": metadata["chapter"],
        "verse": metadata["verse"],
        "translation": metadata["translation"],
        "summarized_commentary": metadata.get("summary", "")
    }


def get_personalized_verse(queries: list[str], seen_verses: list[str]):
    """
    Get a personalized verse based on user's query themes.

    Args:
        queries: List of user's past queries
        seen_verses: List of "chapter:verse" strings to exclude

    Returns:
        Verse dict with chapter, verse, translation, commentary, and matched_theme
    """
    import numpy as np

    if not queries:
        return None

    # Convert seen_verses to a set for fast lookup
    seen_set = set(seen_verses) if seen_verses else set()

    # Embed all queries
    query_instructions = [
        f"Represent this sentence for searching relevant passages: {q}"
        for q in queries
    ]
    embeddings = embedding_model.encode(query_instructions)

    # Average embeddings to get theme vector
    theme_vector = np.mean(embeddings, axis=0).tolist()

    # Query for similar verses (get extra to filter out seen ones)
    results = index.query(
        vector=theme_vector,
        top_k=20,
        include_metadata=True
    )

    if not results["matches"]:
        return None

    # Find first unseen verse
    selected_match = None
    for m in results["matches"]:
        meta = m["metadata"]
        verse_key = f"{meta['chapter']}:{meta['verse']}"
        if verse_key not in seen_set:
            selected_match = m
            break

    # Fallback to first match if all are seen
    if not selected_match:
        selected_match = results["matches"][0]

    metadata = selected_match["metadata"]

    # Use first query as the matched theme (skip expensive similarity calc)
    matched_theme = queries[0]

    return {
        "chapter": metadata["chapter"],
        "verse": metadata["verse"],
        "translation": metadata["translation"],
        "summarized_commentary": metadata.get("summary", ""),
        "matched_theme": matched_theme
    }


if __name__ == "__main__":
    while True:
        query = input("Enter your query (type 'exit' to quit): ")
        if query.lower() == "exit":
            print("Exiting the program. Goodbye!")
            break
        best_verse = match(query)
        if best_verse:
            print(f"\nBest matching verse:\nChapter {best_verse['chapter']}, Verse {best_verse['verse']}\n")
            print(f"Translation: {best_verse['translation']}")
            print(f"Summarized Commentary: {best_verse['summarized_commentary']}\n")
        else:
            print("No matching verse found.\n")
