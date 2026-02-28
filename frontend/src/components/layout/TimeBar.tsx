"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  getCurrentDate,
  advanceDay as apiAdvanceDay,
  advanceMonth as apiAdvanceMonth,
} from "@/lib/api";

export default function TimeBar() {
  const { token } = useAuth();
  const [simDate, setSimDate] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const fetchDate = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getCurrentDate(token);
      setSimDate(data.current_date ?? data.date ?? JSON.stringify(data));
    } catch {
      // API may not be running yet
      setSimDate("--");
    }
  }, [token]);

  useEffect(() => {
    fetchDate();
  }, [fetchDate]);

  const handleAdvanceDay = async () => {
    if (!token || isAdvancing) return;
    setIsAdvancing(true);
    try {
      await apiAdvanceDay(token);
      await fetchDate();
    } catch {
      // silently fail
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdvanceMonth = async () => {
    if (!token || isAdvancing) return;
    setIsAdvancing(true);
    try {
      await apiAdvanceMonth(token);
      await fetchDate();
    } catch {
      // silently fail
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 flex h-12 w-full items-center justify-between border-t border-[#2b2839] bg-surface-card/90 px-6 backdrop-blur-md">
      {/* Left: simulation date */}
      <div className="flex items-center gap-3 pl-[250px]">
        <span className="label-tracked text-[10px] text-zinc-500">
          Simulation Date
        </span>
        <span className="text-sm font-semibold tracking-wide text-zinc-200">
          {simDate ?? "..."}
        </span>
      </div>

      {/* Right: advance buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAdvanceDay}
          disabled={isAdvancing}
          className="rounded border border-[#2b2839] bg-surface-card px-3 py-1 text-xs font-medium uppercase tracking-wider text-zinc-400 transition-colors hover:border-primary/50 hover:text-primary-light disabled:opacity-40"
        >
          {isAdvancing ? "..." : "Advance Day"}
        </button>
        <button
          onClick={handleAdvanceMonth}
          disabled={isAdvancing}
          className="rounded border border-[#2b2839] bg-surface-card px-3 py-1 text-xs font-medium uppercase tracking-wider text-zinc-400 transition-colors hover:border-primary/50 hover:text-primary-light disabled:opacity-40"
        >
          {isAdvancing ? "..." : "Advance Month"}
        </button>
      </div>
    </div>
  );
}
