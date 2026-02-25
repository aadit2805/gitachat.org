import { NextResponse } from "next/server";

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let response: Response;
    try {
      response = await fetch(`${backendUrl}/api/all-verses`, {
        next: { revalidate: 3600 },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch verses" }, { status: 500 });
    }

    const data = await response.json();
    const res = NextResponse.json(data);
    res.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return res;
  } catch (err) {
    console.error("All-verses error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch verses" }, { status: 500 });
  }
}
