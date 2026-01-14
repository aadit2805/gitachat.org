"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { QueryHistoryRecord } from "@/lib/supabase";

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function fetchHistory(): Promise<QueryHistoryRecord[]> {
  const res = await fetch("/api/history");

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch history");
  }

  return res.json();
}

export default function HistoryPage() {
  const [selectedItem, setSelectedItem] = useState<QueryHistoryRecord | null>(null);

  const { data: history, isLoading, error } = useQuery({
    queryKey: ["history"],
    queryFn: fetchHistory,
    staleTime: 30 * 1000, // 30 seconds
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
          <Link
            href="/"
            className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            ← Back
          </Link>
          <p className="font-sans text-sm text-saffron">
            {error instanceof Error ? error.message : "Failed to load history"}
          </p>
        </div>
      </div>
    );
  }

  if (selectedItem) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-10 sm:px-10 sm:pt-14 md:px-12">
          <article className="animate-slow-rise">
            <button
              onClick={() => setSelectedItem(null)}
              className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              ← Back to history
            </button>

            <p className="mb-6 font-sans text-xs tracking-wider text-muted-foreground/40">
              {formatDate(selectedItem.created_at)}
            </p>

            <h2 className="mb-8 text-xl tracking-wide text-foreground/80 sm:text-2xl">
              &ldquo;{selectedItem.query}&rdquo;
            </h2>

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
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-10 sm:px-10 sm:pt-14 md:px-12">
        <Link
          href="/"
          className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          ← Back
        </Link>

        <h1 className="mb-12 text-4xl font-medium tracking-[0.04em] sm:text-5xl">
          History
        </h1>

        {!history || history.length === 0 ? (
          <p className="font-sans text-muted-foreground/60">
            No queries yet. Ask your first question!
          </p>
        ) : (
          <div className="space-y-6">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="block w-full border-b border-border/20 pb-6 text-left transition-colors hover:border-saffron/40"
              >
                <p className="mb-2 font-sans text-xs tracking-wider text-muted-foreground/40">
                  {formatDate(item.created_at)}
                </p>
                <p className="mb-2 text-lg tracking-wide text-foreground/80">
                  {item.query}
                </p>
                <p className="font-sans text-sm text-saffron/70">
                  Chapter {item.chapter}, Verse {item.verse}
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
