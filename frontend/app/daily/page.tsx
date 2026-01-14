"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { renderMarkdown, type VerseData } from "@/lib/utils";

async function fetchDailyVerse(): Promise<VerseData> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = await fetch(`/api/daily?tz=${encodeURIComponent(timezone)}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch verse");
  }

  return res.json();
}

export default function DailyPage() {
  const { data: verse, isLoading, error } = useQuery({
    queryKey: ["daily-verse"],
    queryFn: fetchDailyVerse,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-20 sm:px-10 md:px-12">
          <p className="animate-think font-sans text-muted-foreground/60">
            Finding your verse...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-20 sm:px-10 md:px-12">
          <Link
            href="/"
            className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            ← Back
          </Link>
          <p className="font-sans text-sm text-saffron">
            {error instanceof Error ? error.message : "Failed to load your daily verse"}
          </p>
        </div>
      </div>
    );
  }

  if (!verse) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-10 sm:px-10 sm:pt-14 md:px-12">
        <article className="animate-slow-rise">
          <Link
            href="/"
            className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            ← Back
          </Link>

          <h1 className="mb-8 text-4xl font-medium tracking-[0.04em] sm:text-5xl">
            Daily Verse
          </h1>

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
              {renderMarkdown(verse.summarized_commentary)}
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
