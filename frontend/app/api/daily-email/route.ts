import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import { generateDailyVerseEmail } from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

// Bhagavad Gita verse counts per chapter (18 chapters, 700 verses total)
const VERSES_PER_CHAPTER = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78];

function getAllVerses(): { chapter: number; verse: number }[] {
  const verses: { chapter: number; verse: number }[] = [];
  VERSES_PER_CHAPTER.forEach((count, idx) => {
    for (let v = 1; v <= count; v++) {
      verses.push({ chapter: idx + 1, verse: v });
    }
  });
  return verses;
}

function getTodayDateString(timezone: string): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

function getTimezonesAt6AM(now: Date): string[] {
  const targetHour = 8;
  const commonTimezones = [
    "Pacific/Honolulu", "America/Anchorage", "America/Los_Angeles", "America/Denver",
    "America/Chicago", "America/New_York", "America/Sao_Paulo", "Atlantic/Reykjavik",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
    "Asia/Dubai", "Asia/Kolkata", "Asia/Bangkok", "Asia/Singapore",
    "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
    "UTC", "America/Toronto", "America/Vancouver", "America/Phoenix",
    "Europe/Amsterdam", "Europe/Rome", "Europe/Madrid", "Europe/Stockholm",
    "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Seoul", "Australia/Melbourne",
  ];

  return commonTimezones.filter((tz) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
      return hour === targetHour;
    } catch {
      return false;
    }
  });
}

async function getDailyVerseForUser(
  userId: string,
  timezone: string
): Promise<{ chapter: number; verse: number; translation: string; summarized_commentary: string } | null> {
  if (!supabase) return null;

  const today = getTodayDateString(timezone);

  // Check for cached daily verse
  const { data: cached } = await supabase
    .from("daily_verse")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (cached) {
    return {
      chapter: cached.chapter,
      verse: cached.verse,
      translation: cached.translation,
      summarized_commentary: cached.summarized_commentary,
    };
  }

  // Get verses user has already seen
  const { data: history } = await supabase
    .from("query_history")
    .select("chapter, verse")
    .eq("user_id", userId);

  const seenSet = new Set((history || []).map((h) => `${h.chapter}:${h.verse}`));

  // Pick random unseen verse
  const allVerses = getAllVerses();
  const unseenVerses = allVerses.filter((v) => !seenSet.has(`${v.chapter}:${v.verse}`));
  const candidates = unseenVerses.length > 0 ? unseenVerses : allVerses;
  const selected = candidates[Math.floor(Math.random() * candidates.length)];

  // Fetch verse from backend
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const response = await fetch(`${backendUrl}/api/verse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapter: selected.chapter, verse: selected.verse }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const verse = data.data;

  // Cache the result
  await supabase.from("daily_verse").insert({
    user_id: userId,
    date: today,
    chapter: verse.chapter,
    verse: verse.verse,
    translation: verse.translation,
    summarized_commentary: verse.summarized_commentary,
    matched_theme: null,
  });

  return verse;
}

export async function POST(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
    }

    const now = new Date();
    const targetTimezones = getTimezonesAt6AM(now);

    if (targetTimezones.length === 0) {
      return NextResponse.json({ sent: 0, message: "No timezones at 6am" });
    }

    // Get active subscribers in target timezones
    const { data: subscribers, error } = await supabase
      .from("email_subscribers")
      .select("*")
      .in("timezone", targetTimezones)
      .eq("is_active", true);

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscribers in target timezones" });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const subscriber of subscribers) {
      try {
        const verse = await getDailyVerseForUser(subscriber.user_id, subscriber.timezone);
        if (!verse) {
          errors.push(`Failed to get verse for ${subscriber.user_id}`);
          continue;
        }

        const unsubscribeUrl = `https://gitachat.org/api/unsubscribe?token=${subscriber.unsubscribe_token}`;
        const email = generateDailyVerseEmail({
          chapter: verse.chapter,
          verse: verse.verse,
          translation: verse.translation,
          commentary: verse.summarized_commentary,
          unsubscribeUrl,
        });

        const { error: sendError } = await resend.emails.send({
          from: "GitaChat <daily@gitachat.org>",
          to: subscriber.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
        });

        if (sendError) {
          errors.push(`Failed to send to ${subscriber.email}: ${sendError.message}`);
          continue;
        }

        // Update last_email_sent_at
        await supabase
          .from("email_subscribers")
          .update({ last_email_sent_at: new Date().toISOString() })
          .eq("user_id", subscriber.user_id);

        sentCount++;
      } catch (err) {
        errors.push(`Error processing ${subscriber.user_id}: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    return NextResponse.json({
      sent: sentCount,
      total: subscribers.length,
      timezones: targetTimezones,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Daily email cron error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Also allow GET for Vercel Cron (it uses GET by default)
export async function GET(req: Request) {
  // Vercel Cron sends authorization via different header
  const cronSecret = req.headers.get("authorization") || req.headers.get("x-vercel-cron-secret");

  // Create a new request with the authorization header for POST handler
  const newReq = new Request(req.url, {
    method: "POST",
    headers: new Headers({
      authorization: cronSecret || "",
    }),
  });

  return POST(newReq);
}
