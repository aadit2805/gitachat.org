/**
 * Centralized constants for GitaChat frontend.
 */

// LocalStorage keys
export const LAST_SEARCH_KEY = "gitachat_last_search";

// Query stale times (in milliseconds)
export const STALE_TIME = {
  BOOKMARKS: 30 * 1000, // 30 seconds
  HISTORY: 30 * 1000, // 30 seconds
  DAILY_VERSE: 5 * 60 * 1000, // 5 minutes
  ALL_VERSES: 60 * 60 * 1000, // 1 hour
  VERSE: 5 * 60 * 1000, // 5 minutes
} as const;

// API rate limiting
export const RATE_LIMIT = {
  QUERIES_PER_MINUTE: 30,
} as const;

// Suggested prompts for home page
export const SUGGESTED_PROMPTS = [
  "How do I find inner peace?",
  "What is my purpose in life?",
  "How to overcome fear?",
  "What is true happiness?",
] as const;
