import Link from "next/link";

const CHAPTERS = [
  { number: 1, name: "Arjuna's Despair", verses: 47 },
  { number: 2, name: "The Yoga of Knowledge", verses: 72 },
  { number: 3, name: "The Yoga of Action", verses: 43 },
  { number: 4, name: "The Yoga of Wisdom", verses: 42 },
  { number: 5, name: "The Yoga of Renunciation", verses: 29 },
  { number: 6, name: "The Yoga of Meditation", verses: 47 },
  { number: 7, name: "Knowledge and Realization", verses: 30 },
  { number: 8, name: "The Eternal Brahman", verses: 28 },
  { number: 9, name: "The Royal Secret", verses: 34 },
  { number: 10, name: "Divine Manifestations", verses: 42 },
  { number: 11, name: "The Universal Form", verses: 55 },
  { number: 12, name: "The Yoga of Devotion", verses: 20 },
  { number: 13, name: "The Field and Knower", verses: 35 },
  { number: 14, name: "The Three Gunas", verses: 27 },
  { number: 15, name: "The Supreme Self", verses: 20 },
  { number: 16, name: "Divine and Demonic Natures", verses: 24 },
  { number: 17, name: "Three Kinds of Faith", verses: 28 },
  { number: 18, name: "Liberation Through Renunciation", verses: 78 },
];

export default function ReadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
        <h1 className="mb-12 text-4xl font-medium tracking-[0.04em] sm:text-5xl">
          Read
        </h1>

        <div className="space-y-4">
          {CHAPTERS.map((chapter) => (
            <Link
              key={chapter.number}
              href={`/read/${chapter.number}`}
              className="block border-b border-border/20 pb-4 transition-colors hover:border-saffron/40"
            >
              <div className="flex items-baseline justify-between">
                <p className="font-sans text-sm text-saffron/70">
                  Chapter {chapter.number}
                </p>
                <p className="font-sans text-xs text-muted-foreground/40">
                  {chapter.verses} verses
                </p>
              </div>
              <p className="mt-1 text-lg tracking-wide text-foreground/80">
                {chapter.name}
              </p>
            </Link>
          ))}
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
