import os
from dotenv import load_dotenv

load_dotenv()

from sentence_transformers import SentenceTransformer, CrossEncoder
from pinecone import Pinecone

os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Embedding model - bge-base-en-v1.5 (768-dim, top MTEB performance)
embedding_model = SentenceTransformer("BAAI/bge-base-en-v1.5")

# Cross-encoder for reranking (more accurate but slower, only used on top results)
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))


def match(query):
    # BGE models work best with instruction prefix for queries
    query_with_instruction = f"Represent this sentence for searching relevant passages: {query}"
    query_embedding = embedding_model.encode(query_with_instruction).tolist()

    # Fetch top 5 candidates from Pinecone
    results = index.query(
        vector=query_embedding,
        top_k=5,
        include_metadata=True
    )

    if not results["matches"]:
        return None

    # Prepare candidates for reranking
    candidates = []
    for match in results["matches"]:
        metadata = match["metadata"]
        # Combine translation and summary for reranking
        text = f"{metadata['translation']} {metadata.get('summary', '')}"
        candidates.append({
            "text": text,
            "metadata": metadata,
            "vector_score": match["score"]
        })

    # Rerank using cross-encoder
    query_candidate_pairs = [(query, c["text"]) for c in candidates]
    rerank_scores = reranker.predict(query_candidate_pairs)

    # Add rerank scores and sort
    for i, candidate in enumerate(candidates):
        candidate["rerank_score"] = float(rerank_scores[i])

    # Sort by rerank score (higher is better)
    candidates.sort(key=lambda x: x["rerank_score"], reverse=True)

    # Return best result after reranking
    best = candidates[0]
    metadata = best["metadata"]

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
