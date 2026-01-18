/**
 * Shared error component for page-level error states.
 */

interface PageErrorProps {
  error: Error | unknown;
  fallbackMessage?: string;
}

export function PageError({
  error,
  fallbackMessage = "Something went wrong",
}: PageErrorProps) {
  const message =
    error instanceof Error ? error.message : fallbackMessage;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-20 sm:px-10 md:px-12">
        <p className="font-sans text-sm text-saffron">{message}</p>
      </div>
    </div>
  );
}
