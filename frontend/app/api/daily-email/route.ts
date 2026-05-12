import { NextResponse, after } from "next/server";
import { timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import { generateDailyVerseEmail } from "@/lib/email-templates";
import { getAllVerseRefs } from "@/lib/chapters";
import { getTodayDateString } from "@/lib/date";

export const maxDuration = 300;

const resend = new Resend(process.env.RESEND_API_KEY);

function getTimezonesAt8AM(now: Date): string[] {
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
  const allVerses = getAllVerseRefs();
  const unseenVerses = allVerses.filter((v) => !seenSet.has(`${v.chapter}:${v.verse}`));
  const candidates = unseenVerses.length > 0 ? unseenVerses : allVerses;
  const selected = candidates[Math.floor(Math.random() * candidates.length)];

  // Fetch verse from backend with timeout
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(`${backendUrl}/api/verse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapter: selected.chapter, verse: selected.verse }),
      signal: controller.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }

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

type Subscriber = {
  user_id: string;
  email: string;
  timezone: string;
  unsubscribe_token: string;
};

async function sendDailyEmailToSubscriber(subscriber: Subscriber): Promise<boolean> {
  if (!supabase) return false;

  const verse = await getDailyVerseForUser(subscriber.user_id, subscriber.timezone);
  if (!verse) {
    console.error(`Failed to get verse for subscriber ${subscriber.user_id}`);
    return false;
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
    console.error(`Failed to send to ${subscriber.user_id}: ${sendError.message}`);
    return false;
  }

  await supabase
    .from("email_subscribers")
    .update({ last_email_sent_at: new Date().toISOString() })
    .eq("user_id", subscriber.user_id);

  return true;
}

async function processDailyEmails(): Promise<void> {
  if (!supabase) return;

  const now = new Date();
  const targetTimezones = getTimezonesAt8AM(now);

  if (targetTimezones.length === 0) {
    console.log("Daily email cron: no timezones at 8am");
    return;
  }

  const { data: subscribers, error } = await supabase
    .from("email_subscribers")
    .select("user_id, email, timezone, unsubscribe_token")
    .in("timezone", targetTimezones)
    .eq("is_active", true);

  if (error) {
    console.error("Daily email cron: supabase query error:", error);
    return;
  }

  if (!subscribers || subscribers.length === 0) {
    console.log("Daily email cron: no subscribers in target timezones", targetTimezones);
    return;
  }

  const results = await Promise.allSettled(
    subscribers.map((s) => sendDailyEmailToSubscriber(s as Subscriber))
  );

  const sentCount = results.filter((r) => r.status === "fulfilled" && r.value).length;
  const failed = results.length - sentCount;
  console.log(
    `Daily email cron: sent=${sentCount} failed=${failed} total=${results.length} timezones=${targetTimezones.join(",")}`
  );
}

export async function POST(req: Request) {
  // Verify cron secret with timing-safe comparison
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization") || "";
  const expected = `Bearer ${cronSecret}`;
  const authBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expected);
  if (
    authBuf.length !== expectedBuf.length ||
    !timingSafeEqual(authBuf, expectedBuf)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  // Process subscribers after the response is sent so cron clients (cron-job.org,
  // Vercel Cron) don't hit their proxy timeout while we fan out emails.
  after(async () => {
    try {
      await processDailyEmails();
    } catch (err) {
      console.error("Daily email cron error:", err);
    }
  });

  return NextResponse.json({ accepted: true }, { status: 202 });
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
