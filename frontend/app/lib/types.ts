/**
 * Consolidated type definitions for GitaChat frontend.
 */

// Related verse from search results
export interface RelatedVerse {
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
}

// Main verse data structure
export interface VerseData {
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
  full_commentary?: string;
  related?: RelatedVerse[];
}

// Bookmark stored in database
export interface Bookmark {
  id: string;
  chapter: number;
  verse: number;
  translation: string;
  summarized_commentary: string;
  created_at: string;
}

// Simplified bookmark for checking saved status
export interface BookmarkCheck {
  chapter: number;
  verse: number;
}

// Saved search result (stored in localStorage)
export interface SavedSearch {
  query: string;
  result: VerseData;
}

// Generated image data
export interface GeneratedImage {
  imageUrl: string;
  shareUrl: string;
  cached: boolean;
}

// User note on a verse
export interface Note {
  id: string;
  chapter: number;
  verse: number;
  note_text: string;
  updated_at: string;
}
