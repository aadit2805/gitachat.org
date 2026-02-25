import { VERSES_PER_CHAPTER } from "@/lib/chapters";

export function isValidChapterVerse(chapter: number, verse: number): boolean {
  if (!Number.isInteger(chapter) || !Number.isInteger(verse)) return false;
  if (chapter < 1 || chapter > 18) return false;
  if (verse < 1 || verse > (VERSES_PER_CHAPTER[chapter] ?? 0)) return false;
  return true;
}

export function parseIntSafe(value: string | null): number {
  if (!value) return NaN;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return NaN;
  return parsed;
}

export const MAX_TEXT_LENGTH = 5000;
export const MAX_NOTE_LENGTH = 10000;
