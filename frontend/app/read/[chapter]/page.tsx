"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { renderMarkdown, type VerseData } from "@/lib/utils";
import { VerseActions } from "@/components/VerseActions";

const CHAPTERS = [
  { number: 1, name: "Arjuna's Despair", verses: 47 },
  { number: 2, name: "The Yoga of Knowledge", verses: 72 },
  { number: 3, name: "The Yoga of Action", verses: 43 },
  { number: 4, name: "The Yoga of Wisdom", verses: 42 },
  { number: 5, name: "The Yoga of Renunciation", verses: 29 },
  { number: 6, name: "The Yoga of Meditation", verses: 47 },
  { number: 7, name: "Knowledge and Realization", verses: 30 },
  { number: 8, name: "The Eternal Brahman", verses: 28 },
  { number: 9, name: "The Royal Secret", verses: 34 },
  { number: 10, name: "Divine Manifestations", verses: 42 },
  { number: 11, name: "The Universal Form", verses: 55 },
  { number: 12, name: "The Yoga of Devotion", verses: 20 },
  { number: 13, name: "The Field and Knower", verses: 35 },
  { number: 14, name: "The Three Gunas", verses: 27 },
  { number: 15, name: "The Supreme Self", verses: 20 },
  { number: 16, name: "Divine and Demonic Natures", verses: 24 },
  { number: 17, name: "Three Kinds of Faith", verses: 28 },
  { number: 18, name: "Liberation Through Renunciation", verses: 78 },
];

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
  const chapterNum = parseInt(params.chapter as string);
  const [currentVerse, setCurrentVerse] = useState(1);

  const chapter = CHAPTERS.find((c) => c.number === chapterNum);

  const { data: verse, isLoading, error } = useQuery({
    queryKey: ["verse", chapterNum, currentVerse],
    queryFn: () => fetchVerse(chapterNum, currentVerse),
    enabled: !!chapter,
    staleTime: 5 * 60 * 1000,
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
          <article className="animate-slow-rise">
            <div className="mb-8 inline-block bg-saffron-light px-4 py-2">
              <span className="font-sans text-sm font-medium tracking-wide text-saffron">
                Verse {currentVerse} of {chapter.verses}
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
                {renderMarkdown(verse.summarized_commentary)}
              </p>
            </div>

            <div className="mt-10">
              <VerseActions
                chapter={verse.chapter}
                verse={verse.verse}
                translation={verse.translation}
                summarized_commentary={verse.summarized_commentary}
              />
            </div>
          </article>
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
