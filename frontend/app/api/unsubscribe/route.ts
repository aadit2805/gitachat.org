import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - One-click unsubscribe via token (no auth required)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (!supabase) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const { error } = await supabase
      .from("email_subscribers")
      .update({ is_active: false })
      .eq("unsubscribe_token", token);

    if (error) {
      console.error("Unsubscribe error:", error);
    }

    // Redirect to unsubscribed confirmation page
    return NextResponse.redirect(new URL("/unsubscribed", req.url));
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
