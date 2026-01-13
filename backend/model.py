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
    if not queries:
        return None

    # Embed all queries
    query_instructions = [
        f"Represent this sentence for searching relevant passages: {q}"
        for q in queries
    ]
    embeddings = embedding_model.encode(query_instructions)

    # Average embeddings to get theme vector
    import numpy as np
    theme_vector = np.mean(embeddings, axis=0).tolist()

    # Build filter to exclude seen verses
    filter_dict = None
    if seen_verses:
        # Pinecone filter: exclude verses user has already seen
        filter_dict = {
            "verse_id": {"$nin": seen_verses}
        }

    # Query for similar verses, get a few candidates
    results = index.query(
        vector=theme_vector,
        top_k=10,
        include_metadata=True,
        filter=filter_dict
    )

    if not results["matches"]:
        # Fallback: no filter if all verses seen
        results = index.query(
            vector=theme_vector,
            top_k=1,
            include_metadata=True
        )

    if not results["matches"]:
        return None

    # Pick the best unseen match
    match = results["matches"][0]
    metadata = match["metadata"]

    # Find which query theme was closest (for "why this verse" reasoning)
    matched_theme = queries[0] if queries else None
    if len(queries) > 1:
        # Find the query most similar to this verse
        verse_text = metadata.get("translation", "")
        verse_embedding = embedding_model.encode(
            f"Represent this sentence for searching relevant passages: {verse_text}"
        )
        similarities = [
            np.dot(verse_embedding, emb) for emb in embeddings
        ]
        matched_theme = queries[np.argmax(similarities)]

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
