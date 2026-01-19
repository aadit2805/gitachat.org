"use client";

import { renderMarkdown } from "@/lib/utils";

interface DualCommentaryProps {
  contextual: string;      // AI-generated commentary based on user's question
  traditional?: string;    // Original scholarly commentary
}

export function DualCommentary({ contextual, traditional }: DualCommentaryProps) {
  // If no traditional commentary, just show contextual
  if (!traditional) {
    return (
      <div>
        <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
          Guidance
        </h2>
        <p className="text-base leading-loose tracking-wide text-foreground/70 sm:text-lg">
          {renderMarkdown(contextual)}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-10">
      {/* Contextual Commentary - For the user's specific question */}
      <div className="md:border-r md:border-border/30 md:pr-10">
        <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
          For You
        </h2>
        <p className="text-base leading-loose tracking-wide text-foreground/70">
          {renderMarkdown(contextual)}
        </p>
      </div>

      {/* Traditional Commentary - Scholarly interpretation */}
      <div>
        <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
          Traditional Commentary
        </h2>
        <p className="text-base leading-loose tracking-wide text-foreground/70">
          {renderMarkdown(traditional)}
        </p>
      </div>
    </div>
  );
}
