import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientId } from "@/lib/rate-limit";

const MAX_QUERY_LENGTH = 500;
const RATE_LIMIT = { limit: 20, windowMs: 60000 }; // 20 requests per minute

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(clientId, RATE_LIMIT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Input validation
    const query = body.query;
    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }
    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: "Query is too long" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let response: Response;
    try {
      response = await fetch(`${backendUrl}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return NextResponse.json({ error: "Request timed out. Please try again." }, { status: 504 });
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Backend server error: ${response.status}`);
    }

    if (data.error) {
      throw new Error(data.error);
    }

    const responseData = data.data;

    // Save to history if user is authenticated and supabase is configured
    // Fire-and-forget: don't block the response waiting for DB write
    const { userId } = await auth();
    if (userId && supabase) {
      supabase
        .from("query_history")
        .insert({
          user_id: userId,
          query: query.trim(),
          chapter: responseData.chapter,
          verse: responseData.verse,
          translation: responseData.translation,
          summarized_commentary: responseData.summarized_commentary,
          full_commentary: responseData.full_commentary || null,
        })
        .then(
          () => {},
          (err) => console.error("Failed to save query history:", err)
        );
    }

    return NextResponse.json(responseData);
  } catch (err) {
    // Log detailed error server-side only
    console.error("Query error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}


