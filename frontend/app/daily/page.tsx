"use client";

import { useQuery } from "@tanstack/react-query";
import type { VerseData } from "@/lib/types";
import { STALE_TIME } from "@/lib/constants";
import { PageLoading } from "@/components/PageLoading";
import { PageError } from "@/components/PageError";
import { VerseDisplay } from "@/components/VerseDisplay";

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
    staleTime: STALE_TIME.DAILY_VERSE,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  if (isLoading) {
    return <PageLoading message="Finding your verse..." />;
  }

  if (error) {
    return <PageError error={error} fallbackMessage="Failed to load your daily verse" />;
  }

  if (!verse) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
        <h1 className="mb-8 text-4xl font-medium tracking-[0.04em] sm:text-5xl">
          Daily Verse
        </h1>

        <VerseDisplay
          chapter={verse.chapter}
          verse={verse.verse}
          translation={verse.translation}
          summarizedCommentary={verse.summarized_commentary}
        />

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
