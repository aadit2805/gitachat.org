"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryHistoryRecord } from "@/lib/supabase";
import { STALE_TIME } from "@/lib/constants";
import { PageLoading } from "@/components/PageLoading";
import { PageError } from "@/components/PageError";
import { VerseDisplay } from "@/components/VerseDisplay";

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

async function clearHistory(): Promise<void> {
  const res = await fetch("/api/history", { method: "DELETE" });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to clear history");
  }
}

export default function HistoryPage() {
  const [selectedItem, setSelectedItem] = useState<QueryHistoryRecord | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const { data: history, isLoading, error } = useQuery({
    queryKey: ["history"],
    queryFn: fetchHistory,
    staleTime: STALE_TIME.HISTORY,
    retry: false,
  });

  const clearMutation = useMutation({
    mutationFn: clearHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
      setShowConfirm(false);
    },
  });

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} fallbackMessage="Failed to load history" />;
  }

  if (selectedItem) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-16 sm:px-10 sm:pt-16 md:px-12">
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
        <div className="mb-12 flex items-baseline justify-between">
          <h1 className="text-4xl font-medium tracking-[0.04em] sm:text-5xl">
            History
          </h1>
          {history && history.length > 0 && !showConfirm && (
            <button
              onClick={() => setShowConfirm(true)}
              className="font-sans text-sm text-muted-foreground/40 transition-colors hover:text-saffron"
            >
              Clear
            </button>
          )}
        </div>

        {showConfirm && (
          <div className="mb-8 border border-border/30 p-4">
            <p className="mb-4 font-sans text-sm text-foreground/80">
              Clear all history? This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                className="font-sans text-sm text-saffron transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {clearMutation.isPending ? "Clearing..." : "Yes, clear"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={clearMutation.isPending}
                className="font-sans text-sm text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            {clearMutation.error && (
              <p className="mt-2 font-sans text-sm text-saffron">
                {clearMutation.error instanceof Error ? clearMutation.error.message : "Failed to clear"}
              </p>
            )}
          </div>
        )}

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
