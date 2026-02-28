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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Lease Outcome Markets
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Take a position on lease outcomes. Data-driven insights.
            </p>
          </div>
          <button
            onClick={() => setActiveOnly(!activeOnly)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              activeOnly
                ? "border-blue-300 bg-blue-50 text-blue-600"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full transition-colors ${
                activeOnly ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
            Active Only
          </button>
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
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
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
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-500">
              {"\u2616"}
            </div>
            <p className="text-base font-bold text-gray-900">
              No Markets Available
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {activeOnly
                ? "All markets have been resolved. Toggle filter to view history."
                : "No prediction markets have been created yet."}
            </p>
          </div>
        )}

        {/* How Risk Scores Work */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              How Risk Scores Work
            </h2>
            <img src="/illustrations/sitting-2.svg" alt="" className="w-32 opacity-30" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded bg-red-50 text-sm text-red-400">
                {"\u26A0"}
              </div>
              <h3 className="mb-1 text-sm font-bold text-gray-900">
                Missed Payments
              </h3>
              <p className="text-xs leading-relaxed text-gray-500">
                Increases risk score by 15-25%.
                The model factors in payment history, outstanding installments,
                and accrued balance.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded bg-purple-50 text-sm text-purple-400">
                {"\u2605"}
              </div>
              <h3 className="mb-1 text-sm font-bold text-gray-900">
                Community Score
              </h3>
              <p className="text-xs leading-relaxed text-gray-500">
                Risk elevated below 400.
                Lease compliance, communication responsiveness, and community
                participation all influence scores.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-sm text-blue-400">
                {"\u25C6"}
              </div>
              <h3 className="mb-1 text-sm font-bold text-gray-900">
                Debt Levels
              </h3>
              <p className="text-xs leading-relaxed text-gray-500">
                High installment debt signals financial instability.
                When total obligations exceed 60% of projected income,
                risk scores increase significantly.
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Risk scores are algorithmically generated and updated in real-time. This is not financial advice.
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
