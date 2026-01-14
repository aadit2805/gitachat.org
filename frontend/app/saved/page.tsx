"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { renderMarkdown } from "@/lib/utils";
import { VerseActions } from "@/components/VerseActions";

interface Bookmark {
  id: string;
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
  created_at: string;
}

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
    staleTime: 30 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-20 sm:px-10 md:px-12">
          <p className="animate-think font-sans text-muted-foreground/60">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-20 sm:px-10 md:px-12">
          <p className="font-sans text-sm text-saffron">
            {error instanceof Error ? error.message : "Failed to load saved verses"}
          </p>
        </div>
      </div>
    );
  }

  if (selectedItem) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-16 sm:px-10 sm:pt-16 md:px-12">
          <article className="animate-slow-rise">
            <button
              onClick={() => setSelectedItem(null)}
              className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              ← Back to saved
            </button>

            <div className="mb-8 inline-block bg-saffron-light px-4 py-2">
              <span className="font-sans text-sm font-medium tracking-wide text-saffron">
                Chapter {selectedItem.chapter}, Verse {selectedItem.verse}
              </span>
            </div>

            <blockquote className="mb-12 border-l-2 border-saffron/60 pl-6">
              <p className="text-xl leading-relaxed tracking-wide sm:text-2xl">
                {selectedItem.translation}
              </p>
            </blockquote>

            <div className="mb-10 h-px w-16 bg-border/30" />

            <div>
              <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
                Commentary
              </h2>
              <p className="text-base leading-loose tracking-wide text-foreground/70 sm:text-lg">
                {renderMarkdown(selectedItem.summarized_commentary)}
              </p>
            </div>

            <div className="mt-10">
              <VerseActions
                chapter={selectedItem.chapter}
                verse={selectedItem.verse}
                translation={selectedItem.translation}
                summarized_commentary={selectedItem.summarized_commentary}
              />
            </div>
          </article>
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
