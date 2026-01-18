/**
 * Centralized chapter data for the Bhagavad Gita.
 */

export interface Chapter {
  number: number;
  name: string;
  verses: number;
  summary?: string;
}

// Full chapter data with summaries
export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    name: "Arjuna's Despair",
    verses: 47,
    summary:
      "On the battlefield of Kurukshetra, Arjuna is overwhelmed with grief seeing his relatives and teachers arrayed for war. He drops his bow and refuses to fight, setting the stage for Krishna's teachings.",
  },
  {
    number: 2,
    name: "The Yoga of Knowledge",
    verses: 72,
    summary:
      "Krishna begins his teachings, explaining the eternal nature of the soul, the impermanence of the body, and introduces the concepts of duty (dharma) and equanimity. This chapter contains the essence of the entire Gita.",
  },
  {
    number: 3,
    name: "The Yoga of Action",
    verses: 43,
    summary:
      "Krishna explains karma yoga—the path of selfless action. He teaches that one must perform their duty without attachment to results, and that inaction is not the path to liberation.",
  },
  {
    number: 4,
    name: "The Yoga of Wisdom",
    verses: 42,
    summary:
      "Krishna reveals the ancient origins of this teaching and explains how divine knowledge destroys the bonds of karma. He describes how the wise see inaction in action and action in inaction.",
  },
  {
    number: 5,
    name: "The Yoga of Renunciation",
    verses: 29,
    summary:
      "The paths of renunciation and selfless action are compared. Krishna teaches that true renunciation is internal—giving up attachment to results while continuing to act in the world.",
  },
  {
    number: 6,
    name: "The Yoga of Meditation",
    verses: 47,
    summary:
      "Krishna describes the practice of meditation and self-discipline. He explains how to control the mind, the proper posture and place for meditation, and the fate of the unsuccessful yogi.",
  },
  {
    number: 7,
    name: "Knowledge and Realization",
    verses: 30,
    summary:
      "Krishna reveals his divine nature and explains how all creation emanates from him. He describes the four types of devotees and why the wise worship him as the Supreme.",
  },
  {
    number: 8,
    name: "The Eternal Brahman",
    verses: 28,
    summary:
      "Krishna explains what happens at the time of death and how one's final thoughts determine their next destination. He describes the path of light and the path of darkness.",
  },
  {
    number: 9,
    name: "The Royal Secret",
    verses: 34,
    summary:
      "Called the most confidential knowledge, Krishna explains how he pervades the universe while remaining transcendent. He accepts even the simplest offering made with devotion.",
  },
  {
    number: 10,
    name: "Divine Manifestations",
    verses: 42,
    summary:
      "Krishna describes his divine glories and manifestations in the world. He explains that whatever is powerful, beautiful, or glorious springs from a spark of his splendor.",
  },
  {
    number: 11,
    name: "The Universal Form",
    verses: 55,
    summary:
      "Arjuna is granted divine vision to see Krishna's cosmic form—the Vishvarupa. Overwhelmed by the terrifying and magnificent sight, Arjuna begs Krishna to return to his gentle form.",
  },
  {
    number: 12,
    name: "The Yoga of Devotion",
    verses: 20,
    summary:
      "Krishna explains that devotion (bhakti) is the easiest and most direct path to him. He describes the qualities of his dear devotees and the progressive steps toward divine love.",
  },
  {
    number: 13,
    name: "The Field and Knower",
    verses: 35,
    summary:
      "Krishna distinguishes between the body (the field) and the soul (the knower of the field). He explains the nature of prakriti (matter) and purusha (consciousness).",
  },
  {
    number: 14,
    name: "The Three Gunas",
    verses: 27,
    summary:
      "The three qualities of material nature—sattva (goodness), rajas (passion), and tamas (ignorance)—are explained. Krishna describes how they bind the soul and how to transcend them.",
  },
  {
    number: 15,
    name: "The Supreme Self",
    verses: 20,
    summary:
      "Using the metaphor of an inverted banyan tree, Krishna explains the material world and how to cut through attachment. He reveals himself as the Supreme Person beyond the perishable and imperishable.",
  },
  {
    number: 16,
    name: "Divine and Demonic Natures",
    verses: 24,
    summary:
      "Krishna contrasts divine qualities that lead to liberation with demonic qualities that lead to bondage. He warns against lust, anger, and greed—the three gates to hell.",
  },
  {
    number: 17,
    name: "Three Kinds of Faith",
    verses: 28,
    summary:
      "Faith, food, sacrifice, austerity, and charity are each divided according to the three gunas. Krishna explains how one's nature determines the type of faith they hold.",
  },
  {
    number: 18,
    name: "Liberation Through Renunciation",
    verses: 78,
    summary:
      "The final chapter synthesizes all teachings. Krishna explains the difference between renunciation and tyaga, summarizes the paths to liberation, and delivers his final instruction: surrender unto him completely.",
  },
];

// Verse counts per chapter (for navigation)
export const VERSES_PER_CHAPTER: Record<number, number> = {
  1: 47,
  2: 72,
  3: 43,
  4: 42,
  5: 29,
  6: 47,
  7: 30,
  8: 28,
  9: 34,
  10: 42,
  11: 55,
  12: 20,
  13: 35,
  14: 27,
  15: 20,
  16: 24,
  17: 28,
  18: 78,
};

// Helper functions
export function getChapter(chapterNum: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.number === chapterNum);
}

export function getChapterName(chapterNum: number): string {
  return getChapter(chapterNum)?.name ?? "";
}

export function getVerseCount(chapterNum: number): number {
  return VERSES_PER_CHAPTER[chapterNum] ?? 0;
}

export function getAdjacentVerses(chapter: number, verse: number) {
  const prev =
    verse > 1
      ? { chapter, verse: verse - 1 }
      : chapter > 1
        ? { chapter: chapter - 1, verse: VERSES_PER_CHAPTER[chapter - 1] }
        : null;

  const next =
    verse < VERSES_PER_CHAPTER[chapter]
      ? { chapter, verse: verse + 1 }
      : chapter < 18
        ? { chapter: chapter + 1, verse: 1 }
        : null;

  return { prev, next };
}

export function isValidVerse(chapter: number, verse: number): boolean {
  return (
    chapter >= 1 &&
    chapter <= 18 &&
    verse >= 1 &&
    verse <= (VERSES_PER_CHAPTER[chapter] ?? 0)
  );
}
