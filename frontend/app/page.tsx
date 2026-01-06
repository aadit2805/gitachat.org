"use client";

import { useEffect, useState } from "react";

function renderMarkdown(text: string) {
  // Convert **bold** to <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 sm:px-10 md:px-12">

        {/* Main content */}
        <main className={response ? "pt-10 sm:pt-14" : "pt-[22vh] sm:pt-[25vh]"}>
          {!response ? (
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
                  disabled={loading || !query.trim()}
                  className="bg-saffron px-10 py-3.5 font-sans text-sm font-medium tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {loading ? (
                    <span className="animate-think">Seeking...</span>
                  ) : (
                    "Ask"
                  )}
                </button>
              </form>

              {error && (
                <p className="mt-8 font-sans text-sm text-saffron">{error}</p>
              )}

              {/* Suggested prompts */}
              <div className="mt-16">
                <p className="mb-4 font-sans text-xs tracking-wider text-muted-foreground/40">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "How do I find inner peace?",
                    "What is my purpose in life?",
                    "How to overcome fear?",
                    "What is true happiness?",
                  ].map((prompt) => (
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
              {/* Back button as header */}
              <button
                onClick={reset}
                className="mb-12 block font-sans text-sm tracking-wide text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                ← Back
              </button>

              {/* Chapter/Verse badge */}
              <div className="mb-8 inline-block bg-saffron-light px-4 py-2">
                <span className="font-sans text-sm font-medium tracking-wide text-saffron">
                  Chapter {response.chapter}, Verse {response.verse}
                </span>
              </div>

              {/* Verse */}
              <blockquote className="mb-12 border-l-2 border-saffron/60 pl-6">
                <p className="text-xl leading-relaxed tracking-wide sm:text-2xl">
                  {response.translation}
                </p>
              </blockquote>

              {/* Divider */}
              <div className="mb-10 h-px w-16 bg-border/30" />

              {/* Commentary */}
              <div>
                <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
                  Commentary
                </h2>
                <p className="text-base leading-loose tracking-wide text-foreground/70 sm:text-lg">
                  {renderMarkdown(response.summarized_commentary)}
                </p>
              </div>
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
