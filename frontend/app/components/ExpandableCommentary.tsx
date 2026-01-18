"use client";

import { useState } from "react";
import { renderMarkdown } from "@/lib/utils";

interface ExpandableCommentaryProps {
  summary: string;
  full?: string;
}

export function ExpandableCommentary({ summary, full }: ExpandableCommentaryProps) {
  const [expanded, setExpanded] = useState(false);

  // If no full commentary or it's the same as summary, just show summary
  if (!full || full === summary) {
    return (
      <p className="text-base leading-loose tracking-wide text-foreground/70 sm:text-lg">
        {renderMarkdown(summary)}
      </p>
    );
  }

  return (
    <div>
      <p className="text-base leading-loose tracking-wide text-foreground/70 sm:text-lg">
        {renderMarkdown(expanded ? full : summary)}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 font-sans text-sm tracking-wide text-saffron/70 transition-colors hover:text-saffron"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
}
