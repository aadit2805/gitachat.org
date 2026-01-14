import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientId } from "@/lib/rate-limit";

const RATE_LIMIT = { limit: 30, windowMs: 60000 };
const DELETE_RATE_LIMIT = { limit: 5, windowMs: 60000 };

export async function GET(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`history:${clientId}`, RATE_LIMIT);
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

    const { data, error } = await supabase
      .from("query_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching history:", err);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`history-delete:${clientId}`, DELETE_RATE_LIMIT);
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

    const { error } = await supabase
      .from("query_history")
      .delete()
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error clearing history:", err);
    return NextResponse.json(
      { error: "Failed to clear history" },
      { status: 500 }
    );
  }
}
