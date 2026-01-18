"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Bookmark } from "@/lib/types";
import { STALE_TIME } from "@/lib/constants";
import { PageLoading } from "@/components/PageLoading";
import { PageError } from "@/components/PageError";
import { VerseDisplay } from "@/components/VerseDisplay";

async function fetchBookmarks(): Promise<Bookmark[]> {
  const res = await fetch("/api/bookmarks");

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch saved verses");
  }

  return res.json();
}

export default function SavedPage() {
  const [selectedItem, setSelectedItem] = useState<Bookmark | null>(null);

  const { data: bookmarks, isLoading, error } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: fetchBookmarks,
    staleTime: STALE_TIME.BOOKMARKS,
    retry: false,
  });

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} fallbackMessage="Failed to load saved verses" />;
  }

  if (selectedItem) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-16 sm:px-10 sm:pt-16 md:px-12">
          <button
            onClick={() => setSelectedItem(null)}
            className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            ← Back to saved
          </button>

          <VerseDisplay
            chapter={selectedItem.chapter}
            verse={selectedItem.verse}
            translation={selectedItem.translation}
            summarizedCommentary={selectedItem.summarized_commentary}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
        <h1 className="mb-12 text-4xl font-medium tracking-[0.04em] sm:text-5xl">
          Saved
        </h1>

        {!bookmarks || bookmarks.length === 0 ? (
          <p className="font-sans text-muted-foreground/60">
            No saved verses yet. Tap the lotus icon on any verse to save it.
          </p>
        ) : (
          <div className="space-y-6">
            {bookmarks.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="block w-full border-b border-border/20 pb-6 text-left transition-colors hover:border-saffron/40"
              >
                <p className="mb-2 font-sans text-sm text-saffron/70">
                  Chapter {item.chapter}, Verse {item.verse}
                </p>
                <p className="text-lg leading-relaxed tracking-wide text-foreground/80 line-clamp-2">
                  {item.translation}
                </p>
              </button>
            ))}
          </div>
        )}

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
