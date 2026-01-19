"use client";

import { renderMarkdown } from "@/lib/utils";
import { VerseActions } from "./VerseActions";
import { ExpandableCommentary } from "./ExpandableCommentary";
import { DualCommentary } from "./DualCommentary";

type CommentaryMode = "simple" | "expandable" | "dual";

interface VerseDisplayProps {
  chapter: number;
  verse: number;
  translation: string;
  summarizedCommentary: string;
  fullCommentary?: string;
  showActions?: boolean;
  commentaryMode?: CommentaryMode;
  badgeLabel?: string;
}

export function VerseDisplay({
  chapter,
  verse,
  translation,
  summarizedCommentary,
  fullCommentary,
  showActions = true,
  commentaryMode = "simple",
  badgeLabel,
}: VerseDisplayProps) {
  const badge = badgeLabel ?? `Chapter ${chapter}, Verse ${verse}`;

  const renderCommentary = () => {
    switch (commentaryMode) {
      case "dual":
        return (
          <DualCommentary
            contextual={summarizedCommentary}
            traditional={fullCommentary}
          />
        );
      case "expandable":
        return (
          <>
            <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
              Commentary
            </h2>
            <ExpandableCommentary
              summary={summarizedCommentary}
              full={fullCommentary}
            />
          </>
        );
      default:
        return (
          <>
            <h2 className="mb-4 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
              Commentary
            </h2>
            <p className="text-base leading-loose tracking-wide text-foreground/70 sm:text-lg">
              {renderMarkdown(summarizedCommentary)}
            </p>
          </>
        );
    }
  };

  return (
    <article className="animate-slow-rise">
      {/* Chapter/Verse badge */}
      <div className="mb-8 inline-block bg-saffron-light px-4 py-2">
        <span className="font-sans text-sm font-medium tracking-wide text-saffron">
          {badge}
        </span>
      </div>

      {/* Verse translation */}
      <blockquote className="mb-12 border-l-2 border-saffron/60 pl-6">
        <p className="text-xl leading-relaxed tracking-wide sm:text-2xl">
          {translation}
        </p>
      </blockquote>

      {/* Divider */}
      <div className="mb-10 h-px w-16 bg-border/30" />

      {/* Commentary */}
      <div>{renderCommentary()}</div>

      {/* Actions */}
      {showActions && (
        <div className="mt-10">
          <VerseActions
            chapter={chapter}
            verse={verse}
            translation={translation}
            summarized_commentary={summarizedCommentary}
          />
        </div>
      )}
    </article>
  );
}
