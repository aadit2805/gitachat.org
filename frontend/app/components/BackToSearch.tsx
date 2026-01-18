"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LAST_SEARCH_KEY = "gitachat_last_search";

interface BackToSearchProps {
  chapter: number;
  verse: number;
}

interface SavedSearchResult {
  chapter: number;
  verse: number;
  related?: Array<{ chapter: number; verse: number }>;
}

interface SavedSearch {
  query: string;
  result: SavedSearchResult;
}

export function BackToSearch({ chapter, verse }: BackToSearchProps) {
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_SEARCH_KEY);
      if (!saved) return;

      const parsed: SavedSearch = JSON.parse(saved);
      if (!parsed.query || !parsed.result) return;

      const { result } = parsed;

      // Check if current verse matches the main result
      const isMainResult = result.chapter === chapter && result.verse === verse;

      // Check if current verse matches any related verse
      const isRelatedResult = result.related?.some(
        (r) => r.chapter === chapter && r.verse === verse
      );

      // Only show back link if this verse came from the search
      if (isMainResult || isRelatedResult) {
        setLastQuery(parsed.query);
      }
    } catch {
      // Invalid JSON, ignore
    }
  }, [chapter, verse]);

  if (!lastQuery) return null;

  return (
    <Link
      href={`/?q=${encodeURIComponent(lastQuery)}`}
      className="mb-8 inline-block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-saffron"
    >
      ← Back to search results
    </Link>
  );
}
