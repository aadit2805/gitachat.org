import { NextResponse } from "next/server";
import { rateLimit, getClientId } from "@/lib/rate-limit";

const RATE_LIMIT = { limit: 60, windowMs: 60000 };

export async function POST(req: Request) {
  try {
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`verse:${clientId}`, RATE_LIMIT);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { chapter, verse } = body;

    if (!chapter || !verse) {
      return NextResponse.json({ error: "Missing chapter or verse" }, { status: 400 });
    }

    if (chapter < 1 || chapter > 18 || verse < 1) {
      return NextResponse.json({ error: "Invalid chapter or verse" }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${backendUrl}/api/verse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter, verse }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return NextResponse.json({ error: "Verse not found" }, { status: 404 });
      }

      const data = await response.json();
      return NextResponse.json(data);
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to fetch verse" }, { status: 500 });
  }
}
