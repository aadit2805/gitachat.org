"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { LotusIcon } from "./LotusIcon";

interface VerseActionsProps {
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
}

interface Bookmark {
  chapter: number;
  verse: number;
}

async function fetchBookmarks(): Promise<Bookmark[]> {
  const res = await fetch("/api/bookmarks");
  if (!res.ok) return [];
  return res.json();
}

export function VerseActions({ chapter, verse, translation, summarized_commentary }: VerseActionsProps) {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: bookmarks } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: fetchBookmarks,
    enabled: isSignedIn,
    staleTime: 30 * 1000,
  });

  const isBookmarked = bookmarks?.some((b) => b.chapter === chapter && b.verse === verse);

  const addBookmark = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter, verse, translation, summarized_commentary }),
      });
      if (!res.ok) throw new Error("Failed to bookmark");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const removeBookmark = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookmarks?chapter=${chapter}&verse=${verse}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const handleBookmark = () => {
    if (isBookmarked) {
      removeBookmark.mutate();
    } else {
      addBookmark.mutate();
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/verse/${chapter}/${verse}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPending = addBookmark.isPending || removeBookmark.isPending;

  return (
    <div className="flex items-center gap-4">
      {isSignedIn && (
        <button
          onClick={handleBookmark}
          disabled={isPending}
          className={`transition-colors disabled:opacity-50 ${
            isBookmarked
              ? "text-saffron hover:text-saffron/70"
              : "text-muted-foreground/40 hover:text-saffron"
          }`}
          title={isBookmarked ? "Remove from saved" : "Save verse"}
        >
          <LotusIcon filled={isBookmarked} className="h-5 w-5" />
        </button>
      )}
      <button
        onClick={handleShare}
        className="font-sans text-xs tracking-wide text-muted-foreground/40 transition-colors hover:text-saffron"
      >
        {copied ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
