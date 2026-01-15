import os
from dotenv import load_dotenv

load_dotenv()

# Limit CPU threads to prevent contention on shared infrastructure
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import torch
torch.set_num_threads(1)

from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

# Embedding model - bge-base-en-v1.5 (768-dim, top MTEB performance)
embedding_model = SentenceTransformer("BAAI/bge-base-en-v1.5")

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))


def get_verse(chapter: int, verse: int):
    """Fetch a specific verse by chapter and verse number."""
    # Query Pinecone for the specific verse using metadata filter
    results = index.query(
        vector=[0] * 768,  # Dummy vector, we're filtering by metadata
        top_k=1,
        include_metadata=True,
        filter={"chapter": chapter, "verse": verse}
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
