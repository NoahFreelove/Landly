"use client";

import type { Market } from "@/lib/types";

interface MarketCardProps {
  market: Market;
  onBet: (market: Market) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  eviction:
    "bg-red-500/10 text-red-400 ring-red-500/20",
  maintenance:
    "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  compliance:
    "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  social_credit:
    "bg-purple-500/10 text-purple-400 ring-purple-500/20",
  rent:
    "bg-pink-500/10 text-pink-400 ring-pink-500/20",
};

function categoryStyle(cat: string): string {
  const key = cat.toLowerCase().replace(/\s+/g, "_");
  return (
    CATEGORY_COLORS[key] ||
    "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20"
  );
}

export default function MarketCard({ market, onBet }: MarketCardProps) {
  const yesPercent = Math.round(market.yes_price * 100);
  const noPercent = Math.round(market.no_price * 100);
  const isResolved = !market.is_active;

  return (
    <div
      className={`group relative flex flex-col rounded-xl border bg-surface-card p-5 transition-all duration-300 ${
        isResolved
          ? "border-zinc-700/50 opacity-60"
          : "border-[#2b2839] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
      }`}
    >
      {/* Resolved badge */}
      {isResolved && (
        <div className="absolute right-3 top-3 z-10 rounded bg-zinc-600/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
          Resolved
        </div>
      )}

      {/* Category badge */}
      <span
        className={`mb-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${categoryStyle(
          market.category
        )}`}
      >
        {market.category}
      </span>

      {/* Question */}
      <h3 className="mb-4 text-sm font-bold leading-snug text-white group-hover:text-primary-light transition-colors">
        {market.question}
      </h3>

      {/* YES / NO price columns */}
      <div className="mb-3 flex gap-2">
        <div className="flex flex-1 items-center justify-between rounded-lg bg-accent-green/10 px-3 py-2.5 transition-colors hover:bg-accent-green/15">
          <span className="text-xs font-bold text-accent-green">YES</span>
          <span className="text-sm font-bold tabular-nums text-green-300">
            {yesPercent}%
          </span>
        </div>
        <div className="flex flex-1 items-center justify-between rounded-lg bg-red-500/10 px-3 py-2.5 transition-colors hover:bg-red-500/15">
          <span className="text-xs font-bold text-red-400">NO</span>
          <span className="text-sm font-bold tabular-nums text-red-300">
            {noPercent}%
          </span>
        </div>
      </div>

      {/* Visual split bar */}
      <div className="mb-4 flex h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-accent-green transition-all duration-700"
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-700"
          style={{ width: `${noPercent}%` }}
        />
      </div>

      {/* Volume + CTA row */}
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          VOL: {market.volume} trades
        </span>

        {!isResolved ? (
          <button
            onClick={() => onBet(market)}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/30 active:scale-95"
          >
            Place Bet
          </button>
        ) : (
          <span className="text-[10px] font-mono text-zinc-500">
            Market closed
          </span>
        )}
      </div>
    </div>
  );
}
