"use client";

import { useQuery } from "@tanstack/react-query";
import { PageLoading } from "@/components/PageLoading";
import { PageError } from "@/components/PageError";

interface AdminStats {
  overview: {
    totalUsers: number;
    totalQueries: number;
    totalBookmarks: number;
    emailSubscribers: number;
  };
  topUsers: Array<{
    user_id: string;
    query_count: number;
    first_query: string;
    last_query: string;
  }>;
  topVerses: Array<{
    chapter: number;
    verse: number;
    search_count: number;
  }>;
  recentQueries: Array<{
    user_id: string;
    query: string;
    chapter: number;
    verse: number;
    created_at: string;
  }>;
  dailyQueries: Array<{
    date: string;
    count: number;
  }>;
}

async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch("/api/admin/stats");

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch stats");
  }

  return res.json();
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncateUserId(userId: string) {
  return userId.length > 12 ? `${userId.slice(0, 12)}...` : userId;
}

export default function AdminPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    staleTime: 60000, // 1 minute
    retry: false,
  });

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError error={error} fallbackMessage="Failed to load admin stats" />;
  }

  if (!stats) {
    return <PageError error={new Error("No data")} fallbackMessage="No stats available" />;
  }

  const maxDailyCount = Math.max(...stats.dailyQueries.map((d) => d.count), 1);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
        <h1 className="mb-12 text-4xl font-medium tracking-[0.04em] sm:text-5xl">
          Admin
        </h1>

        {/* Overview Cards */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-border/30 p-6">
            <p className="mb-2 font-sans text-xs uppercase tracking-widest text-muted-foreground/50">
              Total Users
            </p>
            <p className="text-4xl font-medium text-saffron">
              {stats.overview.totalUsers}
            </p>
          </div>
          <div className="border border-border/30 p-6">
            <p className="mb-2 font-sans text-xs uppercase tracking-widest text-muted-foreground/50">
              Total Queries
            </p>
            <p className="text-4xl font-medium text-foreground/80">
              {stats.overview.totalQueries}
            </p>
          </div>
          <div className="border border-border/30 p-6">
            <p className="mb-2 font-sans text-xs uppercase tracking-widest text-muted-foreground/50">
              Bookmarks
            </p>
            <p className="text-4xl font-medium text-foreground/80">
              {stats.overview.totalBookmarks}
            </p>
          </div>
          <div className="border border-border/30 p-6">
            <p className="mb-2 font-sans text-xs uppercase tracking-widest text-muted-foreground/50">
              Email Subscribers
            </p>
            <p className="text-4xl font-medium text-foreground/80">
              {stats.overview.emailSubscribers}
            </p>
          </div>
        </div>

        {/* Daily Queries Chart */}
        {stats.dailyQueries.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
              Queries (Last 30 Days)
            </h2>
            <div className="flex h-32 items-end gap-1">
              {stats.dailyQueries.map((day) => (
                <div
                  key={day.date}
                  className="group relative flex-1"
                  title={`${formatDate(day.date)}: ${day.count} queries`}
                >
                  <div
                    className="w-full bg-saffron/60 transition-colors group-hover:bg-saffron"
                    style={{ height: `${(day.count / maxDailyCount) * 100}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between font-sans text-xs text-muted-foreground/40">
              <span>{stats.dailyQueries[0]?.date ? formatDate(stats.dailyQueries[0].date) : ""}</span>
              <span>{stats.dailyQueries[stats.dailyQueries.length - 1]?.date ? formatDate(stats.dailyQueries[stats.dailyQueries.length - 1].date) : ""}</span>
            </div>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Top Users */}
          <div>
            <h2 className="mb-6 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
              Top Users
            </h2>
            <div className="space-y-3">
              {stats.topUsers.map((user, i) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between border-b border-border/20 pb-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-sm text-muted-foreground/40">
                      {i + 1}.
                    </span>
                    <div>
                      <p className="font-mono text-sm text-foreground/70">
                        {truncateUserId(user.user_id)}
                      </p>
                      <p className="font-sans text-xs text-muted-foreground/40">
                        Joined {formatDate(user.first_query)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-sm font-medium text-saffron">
                      {user.query_count}
                    </p>
                    <p className="font-sans text-xs text-muted-foreground/40">
                      queries
                    </p>
                  </div>
                </div>
              ))}
              {stats.topUsers.length === 0 && (
                <p className="font-sans text-sm text-muted-foreground/50">No users yet</p>
              )}
            </div>
          </div>

          {/* Top Verses */}
          <div>
            <h2 className="mb-6 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
              Top Verses
            </h2>
            <div className="space-y-3">
              {stats.topVerses.map((verse, i) => (
                <div
                  key={`${verse.chapter}-${verse.verse}`}
                  className="flex items-center justify-between border-b border-border/20 pb-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-sm text-muted-foreground/40">
                      {i + 1}.
                    </span>
                    <a
                      href={`/verse/${verse.chapter}/${verse.verse}`}
                      className="font-sans text-sm text-foreground/70 transition-colors hover:text-saffron"
                    >
                      Chapter {verse.chapter}, Verse {verse.verse}
                    </a>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-sm font-medium text-saffron">
                      {verse.search_count}
                    </p>
                    <p className="font-sans text-xs text-muted-foreground/40">
                      times
                    </p>
                  </div>
                </div>
              ))}
              {stats.topVerses.length === 0 && (
                <p className="font-sans text-sm text-muted-foreground/50">No data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Queries */}
        <div className="mt-12">
          <h2 className="mb-6 font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
            Recent Queries
          </h2>
          <div className="space-y-4">
            {stats.recentQueries.map((q, i) => (
              <div
                key={`${q.user_id}-${q.created_at}-${i}`}
                className="border-b border-border/20 pb-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-foreground/40">
                    {truncateUserId(q.user_id)}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground/40">
                    {formatDateTime(q.created_at)}
                  </p>
                </div>
                <p className="mb-1 text-foreground/80">&ldquo;{q.query}&rdquo;</p>
                <p className="font-sans text-sm text-saffron/70">
                  → {q.chapter}:{q.verse}
                </p>
              </div>
            ))}
            {stats.recentQueries.length === 0 && (
              <p className="font-sans text-sm text-muted-foreground/50">No queries yet</p>
            )}
          </div>
        </div>

        <footer className="mt-auto pb-8 pt-20">
          <div className="mb-6 h-px w-12 bg-border/20" />
          <p className="font-sans text-xs tracking-wider text-muted-foreground/40">
            Admin Dashboard
          </p>
        </footer>
      </div>
    </div>
  );
}
