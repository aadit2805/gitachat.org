"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

const EMBED_CODE = `<iframe
  src="https://gitachat.org/widget"
  width="100%"
  height="200"
  frameborder="0"
  style="border-radius: 8px; max-width: 400px;"
></iframe>`;

export default function EmbedPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(EMBED_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
        <h1 className="mb-4 text-4xl font-medium tracking-[0.04em] sm:text-5xl">
          Embed Widget
        </h1>
        <p className="mb-12 font-sans text-sm tracking-wide text-muted-foreground/70">
          Add a daily verse from the Bhagavad Gita to your website.
        </p>

        {/* Preview */}
        <div className="mb-8">
          <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
            Preview
          </h2>
          <div className="overflow-hidden rounded-lg border border-border/20">
            <iframe
              src="/widget"
              width="100%"
              height="200"
              className="block"
            />
          </div>
        </div>

        {/* Embed Code */}
        <div className="mb-8">
          <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
            Embed Code
          </h2>
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg bg-black/30 p-4 font-mono text-sm text-foreground/70">
              {EMBED_CODE}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded bg-saffron/20 px-3 py-1.5 font-sans text-xs text-saffron transition-colors hover:bg-saffron/30"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
            How to Use
          </h2>
          <ol className="space-y-3 font-sans text-sm leading-relaxed text-muted-foreground/70">
            <li>1. Copy the embed code above</li>
            <li>2. Paste it into your website&apos;s HTML where you want the widget to appear</li>
            <li>3. Adjust the width, height, and max-width as needed</li>
          </ol>
        </div>

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
