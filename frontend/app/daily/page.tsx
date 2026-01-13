"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

interface DailyVerse {
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
}

export default function DailyPage() {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVerse() {
      try {
        const res = await fetch("/api/daily");
        if (!res.ok) {
          if (res.status === 401) {
            setError("Please sign in to see your daily verse");
            return;
          }
          if (res.status === 404) {
            setError("Ask some questions first to get your daily verse!");
            return;
          }
          throw new Error("Failed to fetch verse");
        }
        const data = await res.json();
        setVerse(data);
      } catch {
        setError("Failed to load your daily verse");
      } finally {
        setLoading(false);
      }
    }
    fetchVerse();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-20 sm:px-10 md:px-12">
          <p className="animate-think font-sans text-muted-foreground/60">
            Finding your verse...
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
          <p className="font-sans text-sm text-saffron">{error}</p>
        </div>
      </div>
    );
  }

  if (!verse) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-10 sm:px-10 sm:pt-14 md:px-12">
        <article className="animate-slow-rise">
          <Link
            href="/"
            className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            ← Back
          </Link>

          <h1 className="mb-8 text-4xl font-medium tracking-[0.04em] sm:text-5xl">
            Daily Verse
          </h1>

          <div className="mb-8 inline-block bg-saffron-light px-4 py-2">
            <span className="font-sans text-sm font-medium tracking-wide text-saffron">
              Chapter {verse.chapter}, Verse {verse.verse}
            </span>
          </div>

          <blockquote className="mb-12 border-l-2 border-saffron/60 pl-6">
            <p className="text-xl leading-relaxed tracking-wide sm:text-2xl">
              {verse.translation}
            </p>
          </blockquote>

          <div className="mb-10 h-px w-16 bg-border/30" />

          <div>
            <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
              Commentary
            </h2>
            <p className="text-base leading-loose tracking-wide text-foreground/70 sm:text-lg">
              {renderMarkdown(verse.summarized_commentary)}
            </p>
          </div>
        </article>

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
