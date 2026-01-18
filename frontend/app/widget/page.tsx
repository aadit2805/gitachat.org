// Get a consistent "verse of the day" based on the date
function getDailyVerseIndex(date: Date): number {
  const start = new Date("2024-01-01");
  const diff = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff % 700; // Cycle through ~700 verses
}

async function getVerseOfTheDay(): Promise<{
  chapter: number;
  verse: number;
  translation: string;
} | null> {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const res = await fetch(`${backendUrl}/api/all-verses`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) return null;

    const data = await res.json();
    const verses = data.data || [];

    if (verses.length === 0) return null;

    const index = getDailyVerseIndex(new Date());
    return verses[index % verses.length];
  } catch {
    return null;
  }
}

export default async function WidgetPage() {
  const verse = await getVerseOfTheDay();

  if (!verse) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1410] p-4">
        <p className="text-sm text-[#a08060]">Unable to load verse</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1410] p-5">
      <div className="w-full max-w-md text-center">
        <p className="mb-3 font-sans text-xs tracking-widest text-[#d97b2e]">
          {verse.chapter}:{verse.verse}
        </p>
        <p className="text-base leading-relaxed text-[#e8dcc8]">
          {verse.translation}
        </p>
      </div>
    </div>
  );
}
