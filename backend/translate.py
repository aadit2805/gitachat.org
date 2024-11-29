import os
import json
import re
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variable
API_KEY = os.getenv('GOOGLE_API_KEY')

# URL for Google Translate API
GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2'

# Regular expression to detect Sanskrit (Devanagari script) characters
devanagari_regex = re.compile(r'[\u0900-\u097F]')

# Function to detect Devanagari text (used for Sanskrit too)
def contains_devanagari(text):
    return devanagari_regex.search(text) is not None

# Function to translate Sanskrit to English using Google Translate API
def translate_to_english(text):
    params = {
        'q': text,
        'source': 'sa',  # 'sa' is the ISO 639-1 code for Sanskrit
        'target': 'en',  # 'en' for English
        'key': API_KEY
    }
    response = requests.get(GOOGLE_TRANSLATE_URL, params=params)
    result = response.json()
    return result['data']['translations'][0]['translatedText']

# Path to your data folder (adjust if necessary)
data_folder = 'data'  # Adjust this to match your actual folder structure

# Loop through each folder (chapter)
for chapter_folder in os.listdir(data_folder):
    chapter_path = os.path.join(data_folder, chapter_folder)

    if os.path.isdir(chapter_path):
        # Loop through each JSON file in the chapter
        for json_file in os.listdir(chapter_path):
            file_path = os.path.join(chapter_path, json_file)

            # Load JSON file
            with open(file_path, 'r') as f:
                verse_data = json.load(f)

            # Check for Sanskrit (Devanagari) in translation and commentary
            if contains_devanagari(verse_data['translation']):
                verse_data['translation'] = translate_to_english(verse_data['translation'])

            if contains_devanagari(verse_data['commentary']):
                verse_data['commentary'] = translate_to_english(verse_data['commentary'])

            # Save the updated file back
            with open(file_path, 'w') as f:
                json.dump(verse_data, f, ensure_ascii=False, indent=4)

print("Translation from Sanskrit to English completed.")
