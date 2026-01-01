import os
import json
import asyncio
from bs4 import BeautifulSoup
import aiohttp
from tqdm.asyncio import tqdm

BASE_URL = "https://www.holy-bhagavad-gita.org/chapter/{}/verse/{}"
DATA_DIR = "data"

async def fetch_verse(session, chapter, verse):
    url = BASE_URL.format(chapter, verse)
    async with session.get(url, timeout=5) as response:
        return await response.text()

async def process_verse(session, chapter, verse):
    html_content = await fetch_verse(session, chapter, verse)
    
    soup = BeautifulSoup(html_content, 'html.parser')
    translation_section = soup.find("div", {"class": "bg-verse-translation"})
    if translation_section is None:
        return None  
    
    translation = translation_section.get_text(strip=True)
    commentary_section = soup.find("div", {"class": "bg-verse-commentary"})
    commentary = commentary_section.get_text(strip=True) if commentary_section else ""
    
    return {
        "chapter": chapter,
        "verse": verse,
        "translation": translation,
        "commentary": commentary
    }

async def save_verse(verse_data):
    chapter_dir = os.path.join(DATA_DIR, f"chapter_{verse_data['chapter']}")
    os.makedirs(chapter_dir, exist_ok=True)
    
    verse_file_path = os.path.join(chapter_dir, f"verse_{verse_data['verse']}.json")
    with open(verse_file_path, "w", encoding="utf-8") as file:
        json.dump(verse_data, file, ensure_ascii=False, indent=4)

async def process_chapter(session, chapter, verse_pbar):
    verse = 1
    results = []
    while True:
        result = await process_verse(session, chapter, verse)
        if result is None:
            break
        await save_verse(result)
        results.append(result)
        verse += 1
        verse_pbar.update(1)
    return results

async def main():
    async with aiohttp.ClientSession() as session:
        chapter_pbar = tqdm(total=18, desc="Processing chapters", position=0)
        verse_pbar = tqdm(desc="Processing verses", position=1, leave=False)

        for chapter in range(1, 19):
            await process_chapter(session, chapter, verse_pbar)
            chapter_pbar.update(1)

        chapter_pbar.close()
        verse_pbar.close()

    print("[bold green]All verses have been processed and saved![/bold green]")

asyncio.run(main())
