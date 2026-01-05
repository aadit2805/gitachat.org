import os
from dotenv import load_dotenv

load_dotenv()

from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

os.environ["TOKENIZERS_PARALLELISM"] = "false"

model = SentenceTransformer('all-MiniLM-L6-v2')

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))

def match(query):
    query_embedding = model.encode(query).tolist()

    results = index.query(
        vector=query_embedding,
        top_k=1,
        include_metadata=True
    )

    match = results['matches'][0]
    metadata = match['metadata']

    return {
        "chapter": metadata['chapter'],
        "verse": metadata['verse'],
        "translation": metadata['translation'],
        "summarized_commentary": metadata['summary']  # Pre-computed, no GPT call
    }


if __name__ == "__main__":
    while True:
        query = input("Enter your query (type 'exit' to quit): ")
        if query.lower() == "exit":
            print("Exiting the program. Goodbye!")
            break
        best_verse = match(query)
        print(f"Best matching verse:\nChapter {best_verse['chapter']}, Verse {best_verse['verse']}\n")
        print(f"Translation: {best_verse['translation']}")
        print(f"Summarized Commentary: {best_verse['summarized_commentary']}")
