import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Sending query:", body.query);

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: body.query }),
    });

    console.log("Backend Response Status:", response.status);
    const data = await response.json();
    console.log("Backend Response Data:", data);

    if (!response.ok) {
      throw new Error(`Backend server error: ${response.status}`);
    }

    if (data.error) {
      throw new Error(data.error);
    }

    const responseData = data.data;

    // Save to history if user is authenticated and supabase is configured
    const { userId } = await auth();
    if (userId && supabase) {
      await supabase.from("query_history").insert({
        user_id: userId,
        query: body.query,
        chapter: responseData.chapter,
        verse: responseData.verse,
        translation: responseData.translation,
        summarized_commentary: responseData.summarized_commentary,
      });
    }

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      {
        error: "Backend server no response.",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


