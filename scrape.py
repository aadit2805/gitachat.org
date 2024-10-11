import asyncio
import json
import os
from bs4 import BeautifulSoup
import aiohttp
from rich.console import Console
from tqdm.asyncio import tqdm

console = Console()

async def fetch_verse(session, chapter, verse):
    url = f"https://bhagavadgita.io/chapter/{chapter}/verse/{verse}"
    async with session.get(url) as response:
        return await response.text()

async def process_verse(session, chapter, verse):
    html_content = await fetch_verse(session, chapter, verse)
    soup = BeautifulSoup(html_content, 'html.parser')
    
    h2_elements = soup.find_all('h2')
    if len(h2_elements) < 2:
        return None
    
    translation = h2_elements[0].find_next('p').text.strip()
    commentary = h2_elements[1].find_next('p').text.strip()
    
    return {
        "chapter": chapter, 
        "verse": verse,
        "translation": translation,
        "commentary": commentary
    }

async def process_chapter(session, chapter, pbar):
    verse = 1
    results = []
    while True:
        result = await process_verse(session, chapter, verse)
        if result is None:
            break
        results.append(result)
        verse += 1
        pbar.update(1)
    return results

async def save_verse(verse_data):
    chapter_dir = os.path.join("data", f"{verse_data['chapter']}")
    os.makedirs(chapter_dir, exist_ok=True)
    
    file_path = os.path.join(chapter_dir, f"{verse_data['verse']}.json")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(verse_data, f, ensure_ascii=False, indent=2)

async def main():
    async with aiohttp.ClientSession() as session:
        chapter_pbar = tqdm(total=18, desc="Processing chapters", position=0)
        verse_pbar = tqdm(desc="Processing verses", position=1, leave=False)

        for chapter in range(1, 19):
            chapter_data = await process_chapter(session, chapter, verse_pbar)
            for verse in chapter_data:
                await save_verse(verse)
            chapter_pbar.update(1)

        chapter_pbar.close()
        verse_pbar.close()

    console.print("[bold green]All verses have been processed and saved![/bold green]")

if __name__ == "__main__":
    asyncio.run(main())
