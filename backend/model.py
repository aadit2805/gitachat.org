import os
import json
import torch
import openai
from sentence_transformers import SentenceTransformer, util
from dotenv import load_dotenv
from tqdm import tqdm

#random statement idk why
os.environ["TOKENIZERS_PARALLELISM"] = "false"

load_dotenv()
openai.api_key = os.getenv("GPT_KEY")


model = SentenceTransformer('all-MiniLM-L6-v2')

data_folder = 'data'

# embed the text
def embed():
    verses = []
    embeddings = []

    for chapter_folder in tqdm(os.listdir(data_folder)):
        chapter_path = os.path.join(data_folder, chapter_folder)

        if os.path.isdir(chapter_path):
            for json_file in tqdm(os.listdir(chapter_path)):
                file_path = os.path.join(chapter_path, json_file)

                with open(file_path, 'r') as f:
                    verse_data = json.load(f)

                # embed the commentary text
                commentary_embedding = model.encode(verse_data['commentary'], convert_to_tensor=True)
                embeddings.append(commentary_embedding)

                # store verse data + embedding
                verses.append(verse_data)

    embeddings = torch.stack(embeddings)
    return verses, embeddings

verses, embeddings = embed()

def summarize(commentary_text, model_name="gpt-4"):
    response = openai.ChatCompletion.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You are a helpful assistant that summarizes text."},
            {"role": "user", "content": f"Summarize the following commentary: {commentary_text}"}
        ],
        max_tokens=200  
    )
    return response.choices[0].message['content'].strip()

def match(query):
    query_embedding = model.encode(query, convert_to_tensor=True) #embed query
    similarities = util.pytorch_cos_sim(query_embedding, embeddings).squeeze() #simiilarity
    match_idx = torch.argmax(similarities).item() #index

    verse = verses[match_idx]
    commentary = summarize(verse['commentary'])

    return {
        "chapter": verse['chapter'],
        "verse": verse['verse'],
        "translation": verse['translation'],
        "summarized_commentary": commentary
    }

# loop to run in terminal
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
