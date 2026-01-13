import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientId } from "@/lib/rate-limit";

const RATE_LIMIT = { limit: 10, windowMs: 60000 };

// Bhagavad Gita verse counts per chapter (18 chapters, 700 verses total)
const VERSES_PER_CHAPTER = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78];

// Generate list of all verse references
function getAllVerses(): { chapter: number; verse: number }[] {
  const verses: { chapter: number; verse: number }[] = [];
  VERSES_PER_CHAPTER.forEach((count, idx) => {
    for (let v = 1; v <= count; v++) {
      verses.push({ chapter: idx + 1, verse: v });
    }
  });
  return verses;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

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

    const today = getTodayDateString();

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
    const allVerses = getAllVerses();
    const unseenVerses = allVerses.filter(
      (v) => !seenSet.has(`${v.chapter}:${v.verse}`)
    );

    // Pick a random unseen verse (or any random if all seen)
    const candidates = unseenVerses.length > 0 ? unseenVerses : allVerses;
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selected = candidates[randomIndex];

    // Fetch the verse from backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/verse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapter: selected.chapter, verse: selected.verse }),
    });

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
