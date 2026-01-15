import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientId } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

const RATE_LIMIT = { limit: 10, windowMs: 60000 };

// GET - Check subscription status
export async function GET(req: Request) {
  try {
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`email-sub:${clientId}`, RATE_LIMIT);
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

    const { data } = await supabase
      .from("email_subscribers")
      .select("timezone, is_active")
      .eq("user_id", userId)
      .single();

    return NextResponse.json({
      subscribed: data?.is_active ?? false,
      timezone: data?.timezone ?? null,
    });
  } catch (err) {
    console.error("Email subscription GET error:", err);
    return NextResponse.json({ error: "Failed to get subscription status" }, { status: 500 });
  }
}

// POST - Subscribe
export async function POST(req: Request) {
  try {
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`email-sub:${clientId}`, RATE_LIMIT);
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

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "No email found for user" }, { status: 400 });
    }

    const body = await req.json();
    const timezone = body.timezone || "UTC";

    // Validate timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }

    // Upsert subscription
    const { error } = await supabase
      .from("email_subscribers")
      .upsert(
        {
          user_id: userId,
          email,
          timezone,
          unsubscribe_token: randomUUID(),
          is_active: true,
          subscribed_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email subscription POST error:", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

// DELETE - Unsubscribe
export async function DELETE(req: Request) {
  try {
    const clientId = getClientId(req);
    const rateLimitResult = rateLimit(`email-sub:${clientId}`, RATE_LIMIT);
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

    const { error } = await supabase
      .from("email_subscribers")
      .update({ is_active: false })
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email subscription DELETE error:", err);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
