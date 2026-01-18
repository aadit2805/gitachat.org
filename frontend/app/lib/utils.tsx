import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface RelatedVerse {
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
}

export interface VerseData {
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
  full_commentary?: string;
  related?: RelatedVerse[];
}

export function renderMarkdown(text: string) {
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
