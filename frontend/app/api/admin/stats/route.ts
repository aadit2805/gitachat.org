import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter((id) => id.length > 0);

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (ADMIN_USER_IDS.length > 0 && !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Fetch all stats in parallel
    const [
      userStatsResult,
      topUsersResult,
      topVersesResult,
      recentQueriesResult,
      dailyQueriesResult,
      bookmarkCountResult,
      emailSubCountResult,
    ] = await Promise.all([
      // Overall stats - use head: true for count, fetch distinct user_ids separately
      supabase
        .from("query_history")
        .select("user_id", { count: "exact", head: true }),

      // Top users by query count
      supabase.rpc("get_top_users", { limit_count: 15 }),

      // Top verses searched
      supabase.rpc("get_top_verses", { limit_count: 10 }),

      // Recent queries
      supabase
        .from("query_history")
        .select("user_id, query, chapter, verse, created_at")
        .order("created_at", { ascending: false })
        .limit(20),

      // Queries per day (last 30 days)
      supabase.rpc("get_daily_query_counts", { days_back: 30 }),

      // Total bookmarks
      supabase
        .from("bookmarks")
        .select("*", { count: "exact", head: true }),

      // Email subscribers
      supabase
        .from("email_subscribers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

    return NextResponse.json({
      overview: {
        totalUsers: topUsersResult.data?.length || 0,
        totalQueries: userStatsResult.count || 0,
        totalBookmarks: bookmarkCountResult.count || 0,
        emailSubscribers: emailSubCountResult.count || 0,
      },
      topUsers: topUsersResult.data || [],
      topVerses: topVersesResult.data || [],
      recentQueries: recentQueriesResult.data || [],
      dailyQueries: dailyQueriesResult.data || [],
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
