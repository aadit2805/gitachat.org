import type { Metadata } from "next";

interface VerseData {
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
}

async function getVerse(chapter: number, verse: number): Promise<VerseData | null> {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const res = await fetch(`${backendUrl}/api/verse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapter, verse }),
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string; verse: string }>;
}): Promise<Metadata> {
  const { chapter, verse } = await params;
  const ch = parseInt(chapter);
  const v = parseInt(verse);
  const data = await getVerse(ch, v);

  if (!data) {
    return { title: "Verse Not Found - GitaChat" };
  }

  return {
    title: `Bhagavad Gita ${ch}:${v} - GitaChat`,
    description: data.translation.slice(0, 160),
    openGraph: {
      title: `Bhagavad Gita Chapter ${ch}, Verse ${v}`,
      description: data.translation,
    },
  };
}

export default async function VersePage({
  params,
}: {
  params: Promise<{ chapter: string; verse: string }>;
}) {
  const { chapter, verse: verseNum } = await params;
  const ch = parseInt(chapter);
  const v = parseInt(verseNum);

  if (isNaN(ch) || isNaN(v) || ch < 1 || ch > 18 || v < 1) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
          <p className="font-sans text-muted-foreground/60">Verse not found.</p>
        </div>
      </div>
    );
  }

  const verse = await getVerse(ch, v);

  if (!verse) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
          <p className="font-sans text-muted-foreground/60">Verse not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
        <article>
          <div className="mb-8 inline-block bg-saffron-light px-4 py-2">
            <span className="font-sans text-sm font-medium tracking-wide text-saffron">
              Chapter {verse.chapter}, Verse {verse.verse}
            </span>
          </div>

          <blockquote className="mb-12 border-l-2 border-saffron/60 pl-6">
            <p className="text-xl leading-relaxed tracking-wide sm:text-2xl">
              {verse.translation}
            </p>
          </blockquote>

          <div className="mb-10 h-px w-16 bg-border/30" />

          <div>
            <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
              Commentary
            </h2>
            <p className="text-base leading-loose tracking-wide text-foreground/70 sm:text-lg">
              {verse.summarized_commentary}
            </p>
          </div>
        </article>

        <footer className="mt-auto pb-8 pt-20">
          <div className="mb-6 h-px w-12 bg-border/20" />
          <p className="font-sans text-xs tracking-wider text-muted-foreground/40">
            Bhagavad Gita
          </p>
        </footer>
      </div>
    </div>
  );
}
