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
          <h1 className="text-3xl font-black uppercase tracking-[0.15em] text-gray-900">
            Lease Risk Assessment
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Resident risk profiles based on payment history and Community Score.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Calculating risk scores...
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-500">
              {"\u2616"}
            </div>
            <p className="text-base font-bold text-gray-900">
              No Leaderboard Data
            </p>
            <p className="mt-1 text-sm text-gray-500">
              The risk assessment engine has not yet generated resident risk
              profiles.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
