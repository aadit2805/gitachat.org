import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientId } from "@/lib/rate-limit";

const RATE_LIMIT = { limit: 10, windowMs: 60000 };

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]; // "2024-01-15"
}

export async function GET(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`votd:${clientId}`, RATE_LIMIT);
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

    // Check for cached verse of the day
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
        matched_theme: cached.matched_theme,
        cached: true,
      });
    }

    // Fetch user's query history
    const { data: history } = await supabase
      .from("query_history")
      .select("query, chapter, verse")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!history || history.length === 0) {
      return NextResponse.json(
        { error: "No query history found. Ask some questions first!" },
        { status: 404 }
      );
    }

    // Extract unique queries and seen verses
    const queries = [...new Set(history.map((h) => h.query))];
    const seenVerses = [
      ...new Set(history.map((h) => `${h.chapter}:${h.verse}`)),
    ];

    // Call backend for personalized verse (with timeout)
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    let response;
    try {
      response = await fetch(`${backendUrl}/api/personalized-verse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: queries.slice(0, 5), // Limit to 5 queries for speed
          seen_verses: seenVerses,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out. Please try again." },
          { status: 504 }
        );
      }
      throw fetchErr;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Backend error");
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
      matched_theme: verse.matched_theme,
    });

    return NextResponse.json({
      ...verse,
      cached: false,
    });
  } catch (err) {
    console.error("Verse of the day error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Failed to get verse of the day" },
      { status: 500 }
    );
  }
}
