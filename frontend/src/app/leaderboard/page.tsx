"use client";

import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import type { LeaderboardEntry } from "@/components/leaderboard/LeaderboardTable";
import { getLeaderboard } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LeaderboardPage() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const data = await getLeaderboard(token);
      setEntries(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load leaderboard data."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-black uppercase tracking-[0.15em] text-white">
            <span className="text-accent-red">EVICTION</span> LEADERBOARD
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Real-time tenant risk assessment &mdash; updated every cycle.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-light border-t-transparent" />
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                Calculating eviction probabilities...
              </p>
            </div>
          </div>
        )}

        {/* Leaderboard table */}
        {!isLoading && !error && entries.length > 0 && (
          <LeaderboardTable entries={entries} />
        )}

        {/* Empty state */}
        {!isLoading && !error && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#2b2839] bg-surface-card py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary-light">
              {"\u2616"}
            </div>
            <p className="text-base font-bold text-white">
              No Leaderboard Data
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              The Predictive Compliance Engine has not yet generated tenant risk
              assessments.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
