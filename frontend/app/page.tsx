"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { type VerseData } from "@/lib/types";
import { LAST_SEARCH_KEY, SUGGESTED_PROMPTS } from "@/lib/constants";
import { VerseActions } from "@/components/VerseActions";
import { ExpandableCommentary } from "@/components/ExpandableCommentary";

interface SavedSearch {
  query: string;
  result: VerseData;
}

async function submitQuery(query: string): Promise<VerseData> {
  const res = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

function HomeContent() {
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [restoredResult, setRestoredResult] = useState<VerseData | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: submitQuery,
    onSuccess: (result, variables) => {
      const saved: SavedSearch = { query: variables, result };
      localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(saved));
    },
  });

  useEffect(() => {
    setMounted(true);

    const queryParam = searchParams.get("q");
    if (queryParam) {
      setQuery(queryParam);

      try {
        const saved = localStorage.getItem(LAST_SEARCH_KEY);
        if (saved) {
          const parsed: SavedSearch = JSON.parse(saved);
          if (parsed.query === queryParam && parsed.result) {
            setRestoredResult(parsed.result);
          }
        }
      } catch {
        mutation.mutate(queryParam);
      }

      router.replace("/", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setRestoredResult(null);
    mutation.mutate(query);
  };

  const reset = () => {
    setQuery("");
    setRestoredResult(null);
    mutation.reset();
  };

  const resultData = mutation.data || restoredResult;

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 sm:px-10 md:px-12">

        {/* Main content */}
        <main className={resultData ? "pt-24 sm:pt-20" : "pt-[22vh] sm:pt-[25vh]"}>
          {!resultData ? (
            <div>
              {/* Title block */}
              <header className="mb-16">
                <button onClick={reset}>
                  <h1 className="text-6xl font-medium tracking-[0.04em] sm:text-7xl md:text-8xl">
                    GitaChat
                  </h1>
                </button>
                <p className="mt-6 font-sans text-sm tracking-wide text-muted-foreground/70">
                  Ask a question. Receive guidance from the Bhagavad Gita.
                </p>
              </header>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What is troubling you?"
                  className="mb-6 w-full border-b border-border/40 bg-transparent pb-3 text-xl tracking-wide placeholder:text-muted-foreground/30 focus:border-saffron/60 focus:outline-none sm:text-2xl"
                  required
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={mutation.isPending || !query.trim()}
                  className="bg-saffron px-10 py-3.5 font-sans text-sm font-medium tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {mutation.isPending ? (
                    <span className="animate-think">Seeking...</span>
                  ) : (
                    "Ask"
                  )}
                </button>
              </form>

              {mutation.error && (
                <p className="mt-8 font-sans text-sm text-saffron">
                  {mutation.error instanceof Error ? mutation.error.message : "Something went wrong"}
                </p>
              )}

              {/* Suggested prompts */}
              <div className="mt-16">
                <p className="mb-4 font-sans text-xs tracking-wider text-muted-foreground/40">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setQuery(prompt)}
                      className="border border-border/30 px-4 py-2 font-sans text-sm text-muted-foreground/60 transition-colors hover:border-saffron/40 hover:text-foreground/80"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <article className="animate-slow-rise">
              <button
                onClick={reset}
                className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                ← Ask another
              </button>

              {/* Chapter/Verse badge */}
              <div className="mb-8 inline-block bg-saffron-light px-4 py-2">
                <span className="font-sans text-sm font-medium tracking-wide text-saffron">
                  Chapter {resultData.chapter}, Verse {resultData.verse}
                </span>
              </div>

              {/* Verse */}
              <blockquote className="mb-12 border-l-2 border-saffron/60 pl-6">
                <p className="text-xl leading-relaxed tracking-wide sm:text-2xl">
                  {resultData.translation}
                </p>
              </blockquote>

              {/* Divider */}
              <div className="mb-10 h-px w-16 bg-border/30" />

              {/* Commentary */}
              <div>
                <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
                  Commentary
                </h2>
                <ExpandableCommentary
                  summary={resultData.summarized_commentary}
                  full={resultData.full_commentary}
                />
              </div>

              <div className="mt-10">
                <VerseActions
                  chapter={resultData.chapter}
                  verse={resultData.verse}
                  translation={resultData.translation}
                  summarized_commentary={resultData.summarized_commentary}
                />
              </div>

              {/* Related Verses */}
              {resultData.related && resultData.related.length > 0 && (
                <div className="mt-16">
                  <div className="mb-6 h-px w-16 bg-border/30" />
                  <h2 className="mb-6 font-sans text-xs font-medium uppercase tracking-widest text-muted-foreground/50">
                    Related Verses
                  </h2>
                  <div className="space-y-4">
                    {resultData.related.map((verse) => (
                      <a
                        key={`${verse.chapter}-${verse.verse}`}
                        href={`/verse/${verse.chapter}/${verse.verse}`}
                        className="block border border-border/20 p-4 transition-colors hover:border-saffron/30 hover:bg-saffron/5"
                      >
                        <span className="mb-2 inline-block font-sans text-xs font-medium tracking-wide text-saffron/70">
                          {verse.chapter}:{verse.verse}
                        </span>
                        <p className="line-clamp-2 text-sm leading-relaxed tracking-wide text-foreground/60">
                          {verse.translation}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )}
        </main>

        {/* Footer - anchored to bottom */}
        <footer className="mt-auto pb-8 pt-20">
          <div className="h-px w-12 bg-border/20 mb-6" />
          <p className="font-sans text-xs tracking-wider text-muted-foreground/40">
            Bhagavad Gita
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-[22vh] sm:px-10 sm:pt-[25vh] md:px-12">
          <header className="mb-16">
            <h1 className="text-6xl font-medium tracking-[0.04em] sm:text-7xl md:text-8xl">
              GitaChat
            </h1>
          </header>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
