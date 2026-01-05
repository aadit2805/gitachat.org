import os
from dotenv import load_dotenv

load_dotenv()

from openai import OpenAI
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

os.environ["TOKENIZERS_PARALLELISM"] = "false"

client = OpenAI(api_key=os.getenv("GPT_KEY"))
model = SentenceTransformer('all-MiniLM-L6-v2')

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))

def summarize(commentary_text, model_name="gpt-4"):
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You are a helpful assistant that summarizes text."},
            {"role": "user", "content": f"Summarize the following commentary: {commentary_text}"}
        ],
        max_tokens=200
    )
    return response.choices[0].message.content.strip()

def match(query):
    query_embedding = model.encode(query).tolist()

    results = index.query(
        vector=query_embedding,
        top_k=1,
        include_metadata=True
    )

    match = results['matches'][0]
    metadata = match['metadata']

    commentary = summarize(metadata['commentary'])

    return {
        "chapter": metadata['chapter'],
        "verse": metadata['verse'],
        "translation": metadata['translation'],
        "summarized_commentary": commentary
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
