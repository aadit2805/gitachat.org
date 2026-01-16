"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

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

interface Verse {
  chapter: number;
  verse: number;
  translation: string;
  summary: string;
}

async function fetchAllVerses(): Promise<Verse[]> {
  const res = await fetch("/api/all-verses");
  if (!res.ok) throw new Error("Failed to fetch verses");
  const data = await res.json();
  return data.data || [];
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-saffron/30 text-foreground">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function truncateWithContext(text: string, query: string, maxLength: number = 150): string {
  if (!query.trim()) return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
  }

  const contextStart = Math.max(0, matchIndex - 50);
  const contextEnd = Math.min(text.length, matchIndex + query.length + 100);

  let snippet = text.slice(contextStart, contextEnd);
  if (contextStart > 0) snippet = "..." + snippet;
  if (contextEnd < text.length) snippet = snippet + "...";

  return snippet;
}

export default function ReadPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: verses = [], isLoading } = useQuery({
    queryKey: ["all-verses"],
    queryFn: fetchAllVerses,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    return verses
      .filter(
        (verse) =>
          verse.translation.toLowerCase().includes(query) ||
          verse.summary.toLowerCase().includes(query)
      )
      .slice(0, 20); // Limit to 20 results
  }, [verses, searchQuery]);

  const showResults = searchQuery.length >= 2;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
        <h1 className="mb-8 text-4xl font-medium tracking-[0.04em] sm:text-5xl">
          Read
        </h1>

        {/* Search input */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verses by keyword..."
            className="w-full border-b border-border/40 bg-transparent pb-3 text-lg tracking-wide placeholder:text-muted-foreground/30 focus:border-saffron/60 focus:outline-none"
          />
          {isLoading && searchQuery.length >= 2 && (
            <p className="mt-2 font-sans text-sm text-muted-foreground/60 animate-think">
              Loading verses...
            </p>
          )}
        </div>

        {showResults ? (
          /* Search results */
          <div className="space-y-6">
            {searchResults.length > 0 ? (
              <>
                <p className="font-sans text-xs tracking-wider text-muted-foreground/50">
                  {searchResults.length} {searchResults.length === 1 ? "result" : "results"} for "{searchQuery}"
                </p>
                {searchResults.map((verse) => (
                  <Link
                    key={`${verse.chapter}-${verse.verse}`}
                    href={`/read/${verse.chapter}?verse=${verse.verse}`}
                    className="block border-b border-border/20 pb-4 transition-colors hover:border-saffron/40"
                  >
                    <p className="mb-2 font-sans text-sm text-saffron/70">
                      Chapter {verse.chapter}, Verse {verse.verse}
                    </p>
                    <p className="text-base leading-relaxed tracking-wide text-foreground/80">
                      {highlightMatch(
                        truncateWithContext(verse.translation, searchQuery),
                        searchQuery
                      )}
                    </p>
                  </Link>
                ))}
              </>
            ) : searchQuery.length >= 2 && !isLoading ? (
              <p className="font-sans text-sm text-muted-foreground/60">
                No verses found matching "{searchQuery}"
              </p>
            ) : null}
          </div>
        ) : (
          /* Chapter list */
          <div className="space-y-4">
            {CHAPTERS.map((chapter) => (
              <Link
                key={chapter.number}
                href={`/read/${chapter.number}`}
                className="block border-b border-border/20 pb-4 transition-colors hover:border-saffron/40"
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-sans text-sm text-saffron/70">
                    Chapter {chapter.number}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground/40">
                    {chapter.verses} verses
                  </p>
                </div>
                <p className="mt-1 text-lg tracking-wide text-foreground/80">
                  {chapter.name}
                </p>
              </Link>
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
