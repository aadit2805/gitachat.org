import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientId } from "@/lib/rate-limit";

const RATE_LIMIT = { limit: 30, windowMs: 60000 };

export async function GET(req: Request) {
  try {
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`bookmarks:${clientId}`, RATE_LIMIT);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`bookmarks:${clientId}`, RATE_LIMIT);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await req.json();
    const { chapter, verse, translation, summarized_commentary } = body;

    if (!chapter || !verse || !translation || !summarized_commentary) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase.from("bookmarks").insert({
      user_id: userId,
      chapter,
      verse,
      translation,
      summarized_commentary,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already bookmarked" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save bookmark" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`bookmarks:${clientId}`, RATE_LIMIT);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const chapter = searchParams.get("chapter");
    const verse = searchParams.get("verse");

    if (!chapter || !verse) {
      return NextResponse.json({ error: "Missing chapter or verse" }, { status: 400 });
    }

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("chapter", parseInt(chapter))
      .eq("verse", parseInt(verse));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
  }
}
