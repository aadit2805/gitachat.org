"use client";

import { Moon, Send, Sun } from "lucide-react";
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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetPage = () => {
    setQuery("");
    setResponse(null);
    setError("");
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 flex items-center justify-between">
          <h1
            onClick={resetPage}
            className="animate-typing cursor-pointer bg-gradient-to-r from-primary to-primary bg-clip-text text-4xl font-bold text-transparent"
          >
            GitaChat
          </h1>
          <button
            onClick={toggleTheme}
            className="hover:bg-secondary/20 rounded-lg p-2 transition-colors"
          >
            {theme === "light" ? <Moon size={24} /> : <Sun size={24} />}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about the Bhagavad Gita..."
              className="gita-input pr-[100px]"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="gita-button absolute right-2 top-1/2 -translate-y-1/2 !py-2"
            >
              {loading ? (
                "Loading..."
              ) : (
                <>
                  Ask <Send className="ml-2 inline-block h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-100/10 p-4 text-red-500">
            {error}
          </div>
        )}

        {response && (
          <div className="gita-card space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">
                Chapter {response.chapter}, Verse {response.verse}
              </span>
              <span className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
                Bhagavad Gita
              </span>
            </div>

            <div className="text-xl font-medium">{response.translation}</div>

            <div className="border-t border-card-border pt-6">
              <h3 className="mb-3 font-medium text-primary">Commentary</h3>
              <p className="text-foreground/80 leading-relaxed">
                {response.summarized_commentary}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
