"use client";

import { useEffect, useState } from "react";

interface GitaResponse {
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<GitaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setQuery("");
    setResponse(null);
    setError("");
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:px-10 sm:py-14 md:px-12 md:py-16">
        {/* Header */}
        <header className="mb-12 sm:mb-auto">
          <button onClick={reset}>
            <h1 className="text-5xl font-medium tracking-tight sm:text-6xl">
              GitaChat
            </h1>
          </button>
        </header>

        {/* Main */}
        <main className="sm:my-auto">
          {!response ? (
            <div>
              <form onSubmit={handleSubmit}>
                <p className="mb-6 font-sans text-base text-muted-foreground">
                  Ask a question. Receive guidance from the Bhagavad Gita.
                </p>

                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What is troubling you?"
                  className="mb-8 w-full border-b-2 border-border bg-transparent pb-3 text-2xl placeholder:text-muted-foreground/40 focus:border-saffron focus:outline-none sm:text-3xl"
                  required
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="bg-saffron px-6 py-3 font-sans text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {loading ? (
                    <span className="animate-think">Seeking...</span>
                  ) : (
                    "Ask"
                  )}
                </button>
              </form>

              {error && (
                <p className="mt-6 font-sans text-sm text-saffron">{error}</p>
              )}
            </div>
          ) : (
            <article className="animate-slow-rise">
              <div className="mb-8 inline-block bg-saffron-light px-3 py-1.5">
                <span className="font-sans text-sm font-medium text-saffron">
                  Chapter {response.chapter}, Verse {response.verse}
                </span>
              </div>

              <blockquote className="mb-10 border-l-2 border-saffron pl-5">
                <p className="text-xl leading-relaxed sm:text-2xl">
                  {response.translation}
                </p>
              </blockquote>

              <div className="mb-12">
                <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-wider text-saffron">
                  Commentary
                </h2>
                <p className="text-base leading-loose text-muted-foreground sm:text-lg">
                  {response.summarized_commentary}
                </p>
              </div>

              <button
                onClick={reset}
                className="font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Ask another question
              </button>
            </article>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-border pt-6">
          <p className="font-sans text-xs text-muted-foreground">
            Bhagavad Gita — Song of the Divine
          </p>
        </footer>
      </div>
    </div>
  );
}
