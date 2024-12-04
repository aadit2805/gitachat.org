import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Sending query:', body.query);

    const response = await fetch("http://localhost:8000/api/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: body.query }),
    });

    console.log('Backend Response Status:', response.status);
    const data = await response.json();
    console.log('Backend Response Data:', data);

    if (!response.ok) {
      throw new Error(`Backend server error: ${response.status}`);
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return NextResponse.json(data.data);
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      {
        error: "Backend server no response.",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}


