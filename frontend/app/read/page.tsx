"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

const CHAPTERS = [
  {
    number: 1,
    name: "Arjuna's Despair",
    verses: 47,
    summary: "On the battlefield of Kurukshetra, Arjuna is overwhelmed with grief seeing his relatives and teachers arrayed for war. He drops his bow and refuses to fight, setting the stage for Krishna's teachings."
  },
  {
    number: 2,
    name: "The Yoga of Knowledge",
    verses: 72,
    summary: "Krishna begins his teachings, explaining the eternal nature of the soul, the impermanence of the body, and introduces the concepts of duty (dharma) and equanimity. This chapter contains the essence of the entire Gita."
  },
  {
    number: 3,
    name: "The Yoga of Action",
    verses: 43,
    summary: "Krishna explains karma yoga—the path of selfless action. He teaches that one must perform their duty without attachment to results, and that inaction is not the path to liberation."
  },
  {
    number: 4,
    name: "The Yoga of Wisdom",
    verses: 42,
    summary: "Krishna reveals the ancient origins of this teaching and explains how divine knowledge destroys the bonds of karma. He describes how the wise see inaction in action and action in inaction."
  },
  {
    number: 5,
    name: "The Yoga of Renunciation",
    verses: 29,
    summary: "The paths of renunciation and selfless action are compared. Krishna teaches that true renunciation is internal—giving up attachment to results while continuing to act in the world."
  },
  {
    number: 6,
    name: "The Yoga of Meditation",
    verses: 47,
    summary: "Krishna describes the practice of meditation and self-discipline. He explains how to control the mind, the proper posture and place for meditation, and the fate of the unsuccessful yogi."
  },
  {
    number: 7,
    name: "Knowledge and Realization",
    verses: 30,
    summary: "Krishna reveals his divine nature and explains how all creation emanates from him. He describes the four types of devotees and why the wise worship him as the Supreme."
  },
  {
    number: 8,
    name: "The Eternal Brahman",
    verses: 28,
    summary: "Krishna explains what happens at the time of death and how one's final thoughts determine their next destination. He describes the path of light and the path of darkness."
  },
  {
    number: 9,
    name: "The Royal Secret",
    verses: 34,
    summary: "Called the most confidential knowledge, Krishna explains how he pervades the universe while remaining transcendent. He accepts even the simplest offering made with devotion."
  },
  {
    number: 10,
    name: "Divine Manifestations",
    verses: 42,
    summary: "Krishna describes his divine glories and manifestations in the world. He explains that whatever is powerful, beautiful, or glorious springs from a spark of his splendor."
  },
  {
    number: 11,
    name: "The Universal Form",
    verses: 55,
    summary: "Arjuna is granted divine vision to see Krishna's cosmic form—the Vishvarupa. Overwhelmed by the terrifying and magnificent sight, Arjuna begs Krishna to return to his gentle form."
  },
  {
    number: 12,
    name: "The Yoga of Devotion",
    verses: 20,
    summary: "Krishna explains that devotion (bhakti) is the easiest and most direct path to him. He describes the qualities of his dear devotees and the progressive steps toward divine love."
  },
  {
    number: 13,
    name: "The Field and Knower",
    verses: 35,
    summary: "Krishna distinguishes between the body (the field) and the soul (the knower of the field). He explains the nature of prakriti (matter) and purusha (consciousness)."
  },
  {
    number: 14,
    name: "The Three Gunas",
    verses: 27,
    summary: "The three qualities of material nature—sattva (goodness), rajas (passion), and tamas (ignorance)—are explained. Krishna describes how they bind the soul and how to transcend them."
  },
  {
    number: 15,
    name: "The Supreme Self",
    verses: 20,
    summary: "Using the metaphor of an inverted banyan tree, Krishna explains the material world and how to cut through attachment. He reveals himself as the Supreme Person beyond the perishable and imperishable."
  },
  {
    number: 16,
    name: "Divine and Demonic Natures",
    verses: 24,
    summary: "Krishna contrasts divine qualities that lead to liberation with demonic qualities that lead to bondage. He warns against lust, anger, and greed—the three gates to hell."
  },
  {
    number: 17,
    name: "Three Kinds of Faith",
    verses: 28,
    summary: "Faith, food, sacrifice, austerity, and charity are each divided according to the three gunas. Krishna explains how one's nature determines the type of faith they hold."
  },
  {
    number: 18,
    name: "Liberation Through Renunciation",
    verses: 78,
    summary: "The final chapter synthesizes all teachings. Krishna explains the difference between renunciation and tyaga, summarizes the paths to liberation, and delivers his final instruction: surrender unto him completely."
  },
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
                  {searchResults.length} {searchResults.length === 1 ? "result" : "results"} for &ldquo;{searchQuery}&rdquo;
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
                No verses found matching &ldquo;{searchQuery}&rdquo;
              </p>
            ) : null}
          </div>
        ) : (
          /* Chapter list */
          <div className="space-y-6">
            {CHAPTERS.map((chapter) => (
              <Link
                key={chapter.number}
                href={`/read/${chapter.number}`}
                className="block border-b border-border/20 pb-6 transition-colors hover:border-saffron/40"
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
                <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground/60">
                  {chapter.summary}
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
