// Bhagavad Gita verse counts per chapter (18 chapters)
const VERSES_PER_CHAPTER = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 18, 78];

export function isValidChapterVerse(chapter: number, verse: number): boolean {
  if (!Number.isInteger(chapter) || !Number.isInteger(verse)) return false;
  if (chapter < 1 || chapter > 18) return false;
  if (verse < 1 || verse > VERSES_PER_CHAPTER[chapter - 1]) return false;
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
