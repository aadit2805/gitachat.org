"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SubscriptionStatus {
  subscribed: boolean;
  timezone: string | null;
}

const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
];

async function fetchSubscription(): Promise<SubscriptionStatus> {
  const res = await fetch("/api/email-subscription");
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch subscription");
  }
  return res.json();
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [timezone, setTimezone] = useState<string>("");

  // Detect user's timezone on mount
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(detected);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["email-subscription"],
    queryFn: fetchSubscription,
    staleTime: 30 * 1000,
    retry: false,
  });

  // Update timezone state when data loads
  useEffect(() => {
    if (data?.timezone) {
      setTimezone(data.timezone);
    }
  }, [data?.timezone]);

  const subscribeMutation = useMutation({
    mutationFn: async (tz: string) => {
      const res = await fetch("/api/email-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: tz }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to subscribe");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-subscription"] });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/email-subscription", { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to unsubscribe");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-subscription"] });
    },
  });

  const handleToggle = () => {
    if (data?.subscribed) {
      unsubscribeMutation.mutate();
    } else {
      subscribeMutation.mutate(timezone);
    }
  };

  const handleTimezoneChange = (newTz: string) => {
    setTimezone(newTz);
    if (data?.subscribed) {
      subscribeMutation.mutate(newTz);
    }
  };

  const isToggling = subscribeMutation.isPending || unsubscribeMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-20 sm:px-10 md:px-12">
          <p className="animate-think font-sans text-muted-foreground/60">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-20 sm:px-10 md:px-12">
          <p className="font-sans text-sm text-saffron">
            {error instanceof Error ? error.message : "Failed to load settings"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-[hsl(25_20%_6%)]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-24 sm:px-10 sm:pt-20 md:px-12">
        <h1 className="mb-12 text-4xl font-medium tracking-[0.04em] sm:text-5xl">
          Settings
        </h1>

        <section className="space-y-8">
          <h2 className="font-sans text-xs font-medium uppercase tracking-widest text-saffron/80">
            Daily Verse Email
          </h2>

          <div className="flex items-center justify-between border-b border-border/20 pb-6">
            <div>
              <p className="text-lg tracking-wide">Email Subscription</p>
              <p className="font-sans text-sm text-muted-foreground/60">
                Receive your daily verse at 8am
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                data?.subscribed
                  ? "bg-saffron"
                  : "bg-border/40"
              } ${isToggling ? "opacity-50" : ""}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                  data?.subscribed ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {data?.subscribed && (
            <div className="space-y-2 animate-slow-rise">
              <label className="font-sans text-sm text-foreground/70">
                Your timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                disabled={subscribeMutation.isPending}
                className="w-full rounded border border-border/30 bg-background px-4 py-3 font-sans text-sm text-foreground focus:border-saffron/60 focus:outline-none"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
                {!COMMON_TIMEZONES.find((tz) => tz.value === timezone) && (
                  <option value={timezone}>{timezone}</option>
                )}
              </select>
              <p className="font-sans text-xs text-muted-foreground/50">
                Emails are sent at 8:00 AM in your selected timezone
              </p>
            </div>
          )}

          {(subscribeMutation.error || unsubscribeMutation.error) && (
            <p className="font-sans text-sm text-red-400">
              {subscribeMutation.error?.message || unsubscribeMutation.error?.message}
            </p>
          )}
        </section>

        <footer className="mt-auto pb-8 pt-20">
          <div className="mb-6 h-px w-12 bg-border/20" />
          <p className="font-sans text-xs tracking-wider text-muted-foreground/40">
            Bhagavad Gita
          </p>
        </footer>
      </div>
    </div>
  );
}
