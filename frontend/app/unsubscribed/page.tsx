import Link from "next/link";

export default function UnsubscribedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 sm:px-10 md:px-12">
        <h1 className="mb-4 text-3xl font-medium tracking-[0.04em]">
          Unsubscribed
        </h1>
        <p className="mb-8 font-sans text-muted-foreground/60">
          You have been unsubscribed from daily verse emails.
        </p>
        <Link
          href="/"
          className="font-sans text-sm text-saffron transition-colors hover:text-saffron/80"
        >
          Return to GitaChat
        </Link>
      </div>
    </div>
  );
}
