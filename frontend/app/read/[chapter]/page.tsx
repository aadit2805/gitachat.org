"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { VerseData } from "@/lib/types";
import { getChapter } from "@/lib/chapters";
import { STALE_TIME } from "@/lib/constants";
import { VerseDisplay } from "@/components/VerseDisplay";

async function fetchVerse(chapter: number, verse: number): Promise<VerseData> {
  const res = await fetch("/api/verse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapter, verse }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch verse");
  }

  const data = await res.json();
  return data.data || data;
}

export default function ChapterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const chapterNum = parseInt(params.chapter as string);
  const verseParam = searchParams.get("verse");
  const [currentVerse, setCurrentVerse] = useState(1);

  const chapter = getChapter(chapterNum);

  // Set initial verse from URL param
  useEffect(() => {
    if (verseParam && chapter) {
      const verseNum = parseInt(verseParam);
      if (verseNum >= 1 && verseNum <= chapter.verses) {
        setCurrentVerse(verseNum);
      }
    }
  }, [verseParam, chapter]);

  const { data: verse, isLoading, error } = useQuery({
    queryKey: ["verse", chapterNum, currentVerse],
    queryFn: () => fetchVerse(chapterNum, currentVerse),
    enabled: !!chapter,
    staleTime: STALE_TIME.VERSE,
  });

  if (!chapter || chapterNum < 1 || chapterNum > 18) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
          <Link
            href="/read"
            className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            ← Back to chapters
          </Link>
          <p className="font-sans text-muted-foreground/60">Chapter not found.</p>
        </div>
      </div>
    );
  }

  const hasPrev = currentVerse > 1;
  const hasNext = currentVerse < chapter.verses;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
        <Link
          href="/read"
          className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          ← Back to chapters
        </Link>

        <div className="mb-8">
          <p className="font-sans text-sm text-saffron/70">Chapter {chapter.number}</p>
          <h1 className="mt-1 text-3xl font-medium tracking-[0.04em] sm:text-4xl">
            {chapter.name}
          </h1>
        </div>

        {isLoading ? (
          <p className="animate-think font-sans text-muted-foreground/60">
            Loading verse...
          </p>
        ) : error ? (
          <p className="font-sans text-sm text-saffron">Failed to load verse</p>
        ) : verse ? (
          <VerseDisplay
            chapter={verse.chapter}
            verse={verse.verse}
            translation={verse.translation}
            summarizedCommentary={verse.summarized_commentary}
            badgeLabel={`Verse ${currentVerse} of ${chapter.verses}`}
          />
        ) : null}

        <div className="mt-12 flex items-center justify-between">
          <button
            onClick={() => setCurrentVerse((v) => v - 1)}
            disabled={!hasPrev || isLoading}
            className="font-sans text-sm text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="font-sans text-xs text-muted-foreground/40">
            {currentVerse} / {chapter.verses}
          </span>
          <button
            onClick={() => setCurrentVerse((v) => v + 1)}
            disabled={!hasNext || isLoading}
            className="font-sans text-sm text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-30"
          >
            Next →
          </button>
        </div>

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
