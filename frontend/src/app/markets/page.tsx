"use client";

import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import WalletWidget from "@/components/markets/WalletWidget";
import MarketCard from "@/components/markets/MarketCard";
import BetModal from "@/components/markets/BetModal";
import { getMarkets } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Market } from "@/lib/types";

export default function MarketsPage() {
  const { token } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [betMarket, setBetMarket] = useState<Market | null>(null);

  const fetchMarkets = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const data = await getMarkets(token);
      setMarkets(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load market data."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const displayedMarkets = activeOnly
    ? markets.filter((m) => m.is_active)
    : markets;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Wallet */}
        <WalletWidget />

        {/* Page header + toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Prediction Markets
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Bet on tenant outcomes. Profit from misery.
            </p>
          </div>
          <button
            onClick={() => setActiveOnly(!activeOnly)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              activeOnly
                ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
                : "border-zinc-700 bg-transparent text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
            }`}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full transition-colors ${
                activeOnly ? "bg-accent-green" : "bg-zinc-600"
              }`}
            />
            Active Only
          </button>
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
              <p className="label-tracked text-zinc-500">
                Loading market data...
              </p>
            </div>
          </div>
        )}

        {/* Markets grid */}
        {!isLoading && !error && displayedMarkets.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onBet={setBetMarket}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && displayedMarkets.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#2b2839] bg-surface-card py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary-light">
              {"\u2616"}
            </div>
            <p className="text-base font-bold text-white">
              No Markets Available
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {activeOnly
                ? "All markets have been resolved. Toggle filter to view history."
                : "No prediction markets have been created yet."}
            </p>
          </div>
        )}

        {/* Eviction Odds Explained */}
        <div className="rounded-xl border border-[#2b2839] bg-surface-card p-6">
          <h2 className="label-tracked mb-4 text-zinc-400">
            Eviction Odds Explained
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white/[0.03] p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded bg-red-500/10 text-sm text-red-400">
                {"\u26A0"}
              </div>
              <h3 className="mb-1 text-sm font-bold text-zinc-200">
                Missed Payments
              </h3>
              <p className="text-xs leading-relaxed text-zinc-500">
                Each missed rent payment increases eviction probability by 15-25%.
                The algorithm factors in payment history, Klarna debt load,
                and accrued interest penalties.
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded bg-purple-500/10 text-sm text-purple-400">
                {"\u2605"}
              </div>
              <h3 className="mb-1 text-sm font-bold text-zinc-200">
                Social Credit Score
              </h3>
              <p className="text-xs leading-relaxed text-zinc-500">
                Tenants below 400 social credit enter the danger zone.
                Noise complaints, late-night activity, and unauthorized guests
                all depress scores and shift odds.
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded bg-accent-klarna/10 text-sm text-accent-klarna">
                {"\u25C6"}
              </div>
              <h3 className="mb-1 text-sm font-bold text-zinc-200">
                Debt Levels
              </h3>
              <p className="text-xs leading-relaxed text-zinc-500">
                High Klarna installment debt signals financial instability.
                When total obligations exceed 60% of projected income,
                eviction odds spike dramatically.
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            Odds are algorithmically generated and updated in real-time. This is not financial advice.
          </p>
        </div>
      </div>

      {/* Bet Modal */}
      <BetModal
        market={betMarket}
        isOpen={!!betMarket}
        onClose={() => setBetMarket(null)}
        onBetPlaced={() => {
          setBetMarket(null);
          fetchMarkets();
        }}
      />
    </AppLayout>
  );
}
