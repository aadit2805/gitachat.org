import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { getAllVerseRefs } from "@/lib/chapters";
import { getTodayDateString } from "@/lib/date";

const RATE_LIMIT = { limit: 10, windowMs: 60000 };

export async function GET(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`daily:${clientId}`, RATE_LIMIT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    // Get user's timezone from query params
    const { searchParams } = new URL(req.url);
    const timezone = searchParams.get("tz") || "UTC";
    const today = getTodayDateString(timezone);

    // Check for cached daily verse
    const { data: cached } = await supabase
      .from("daily_verse")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (cached) {
      return NextResponse.json({
        chapter: cached.chapter,
        verse: cached.verse,
        translation: cached.translation,
        summarized_commentary: cached.summarized_commentary,
        cached: true,
      });
    }

    // Get verses user has already seen
    const { data: history } = await supabase
      .from("query_history")
      .select("chapter, verse")
      .eq("user_id", userId);

    const seenSet = new Set(
      (history || []).map((h) => `${h.chapter}:${h.verse}`)
    );

    // Get all verses and filter out seen ones
    const allVerses = getAllVerseRefs();
    const unseenVerses = allVerses.filter(
      (v) => !seenSet.has(`${v.chapter}:${v.verse}`)
    );

    // Pick a random unseen verse (or any random if all seen)
    const candidates = unseenVerses.length > 0 ? unseenVerses : allVerses;
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selected = candidates[randomIndex];

    // Fetch the verse from backend with timeout
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 15000);
    let response: Response;
    try {
      response = await fetch(`${backendUrl}/api/verse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter: selected.chapter, verse: selected.verse }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(fetchTimeout);
    }

    if (!response.ok) {
      throw new Error("Failed to fetch verse from backend");
    }

    const data = await response.json();
    const verse = data.data;

    // Cache the result for today
    await supabase.from("daily_verse").insert({
      user_id: userId,
      date: today,
      chapter: verse.chapter,
      verse: verse.verse,
      translation: verse.translation,
      summarized_commentary: verse.summarized_commentary,
      matched_theme: null,
    });

    return NextResponse.json({
      ...verse,
      cached: false,
    });
  } catch (err) {
    console.error("Daily verse error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to get daily verse" },
      { status: 500 }
    );
  }
}
