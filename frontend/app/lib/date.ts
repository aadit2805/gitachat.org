/**
 * Get today's date as YYYY-MM-DD in the given timezone.
 * Falls back to UTC if the timezone is invalid.
 */
export function getTodayDateString(timezone: string): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}
