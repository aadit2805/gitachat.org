"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LAST_SEARCH_KEY = "gitachat_last_search";

export function BackToSearch() {
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_SEARCH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.query) {
          setLastQuery(parsed.query);
        }
      }
    } catch {
      // Invalid JSON, ignore
    }
  }, []);

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
