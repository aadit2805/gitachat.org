"""
Core model functionality for GitaChat.
Handles verse matching and retrieval using Pinecone vector search.
"""

from config import EMBEDDING_DIMENSION
from clients import embedding_model, index


def get_verse(chapter: int, verse: int):
    """Fetch a specific verse by chapter and verse number."""
    # Query Pinecone for the specific verse using metadata filter
    results = index.query(
        vector=[0] * EMBEDDING_DIMENSION,  # Dummy vector, we're filtering by metadata
        top_k=1,
        include_metadata=True,
        filter={"chapter": chapter, "verse": verse},
    )

    if not results["matches"]:
        return None

    metadata = results["matches"][0]["metadata"]
    result = {
        "chapter": metadata["chapter"],
        "verse": metadata["verse"],
        "translation": metadata["translation"],
        "summarized_commentary": metadata.get("summary", ""),
    }
    # Include full commentary if available
    if "commentary" in metadata and metadata["commentary"]:
        result["full_commentary"] = metadata["commentary"]
    return result


def match(query):
    """Find the best matching verse for a query using semantic search."""
    # BGE models work best with instruction prefix for queries
    query_with_instruction = (
        f"Represent this sentence for searching relevant passages: {query}"
    )
    query_embedding = embedding_model.encode(query_with_instruction).tolist()

    # Fetch top 8 matches from Pinecone for hybrid search
    results = index.query(
        vector=query_embedding, top_k=8, include_metadata=True
    )

    if not results["matches"]:
        return None

    # Build a list of semantic matches with scores
    semantic_matches = []
    for i, match in enumerate(results["matches"]):
        meta = match["metadata"]
        semantic_matches.append(
            {
                "chapter": meta["chapter"],
                "verse": meta["verse"],
                "translation": meta["translation"],
                "summary": meta.get("summary", ""),
                "commentary": meta.get("commentary", ""),
                "semantic_rank": i,
                "semantic_score": match["score"],
                "keyword_boost": 0,
            }
        )

    # Keyword matching: boost results that contain query terms
    query_lower = query.lower()
    query_terms = [term.strip() for term in query_lower.split() if len(term.strip()) > 2]

    for match in semantic_matches:
        text = (match["translation"] + " " + match["summary"]).lower()
        # Count how many query terms appear in the text
        term_matches = sum(1 for term in query_terms if term in text)
        if term_matches > 0:
            # Boost based on term match ratio
            match["keyword_boost"] = term_matches / len(query_terms) if query_terms else 0

    # Re-rank: combine semantic score with keyword boost
    # semantic_score is typically 0-1, keyword_boost is 0-1
    for match in semantic_matches:
        match["combined_score"] = match["semantic_score"] + (match["keyword_boost"] * 0.15)

    # Sort by combined score (descending)
    semantic_matches.sort(key=lambda x: x["combined_score"], reverse=True)

    # Main result (best combined match)
    best = semantic_matches[0]
    main_result = {
        "chapter": best["chapter"],
        "verse": best["verse"],
        "translation": best["translation"],
        "summarized_commentary": best["summary"],
    }
    if best["commentary"]:
        main_result["full_commentary"] = best["commentary"]

    # Related verses (next 3 unique verses)
    related = []
    seen = {(best["chapter"], best["verse"])}
    for match in semantic_matches[1:]:
        key = (match["chapter"], match["verse"])
        if key not in seen:
            related.append(
                {
                    "chapter": match["chapter"],
                    "verse": match["verse"],
                    "translation": match["translation"],
                    "summarized_commentary": match["summary"],
                }
            )
            seen.add(key)
            if len(related) >= 3:
                break

    main_result["related"] = related
    return main_result
