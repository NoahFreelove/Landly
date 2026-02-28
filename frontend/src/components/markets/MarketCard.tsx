"use client";

import type { Market } from "@/lib/types";

interface MarketCardProps {
  market: Market;
  onBet: (market: Market) => void;
}

export default function MarketCard({ market, onBet }: MarketCardProps) {
  const yesPercent = Math.round(market.yes_price * 100);
  const noPercent = Math.round(market.no_price * 100);
  const isResolved = !market.is_active;

  return (
    <div
      className={`group relative flex flex-col rounded-xl border bg-white p-5 transition-all duration-300 ${
        isResolved
          ? "border-gray-200 opacity-60"
          : "border-gray-200 hover:shadow-sm"
      }`}
    >
      {/* Resolved badge */}
      {isResolved && (
        <div className="absolute right-3 top-3 z-10 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Resolved
        </div>
      )}

      {/* Category badge */}
      <span
        className="mb-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 bg-blue-50 text-blue-600 ring-blue-200"
      >
        Lease Risk
      </span>

      {/* Question */}
      <h3 className="mb-4 text-sm font-bold leading-snug text-gray-900 group-hover:text-blue-600 transition-colors">
        {market.question}
      </h3>

      {/* YES / NO price columns */}
      <div className="mb-3 flex gap-2">
        <div className="flex flex-1 items-center justify-between rounded-lg bg-green-50 px-3 py-2.5 transition-colors hover:bg-green-100">
          <span className="text-xs font-bold text-green-600">YES</span>
          <span className="text-sm font-bold tabular-nums text-green-600">
            {yesPercent}%
          </span>
        </div>
        <div className="flex flex-1 items-center justify-between rounded-lg bg-red-50 px-3 py-2.5 transition-colors hover:bg-red-100">
          <span className="text-xs font-bold text-red-500">NO</span>
          <span className="text-sm font-bold tabular-nums text-red-500">
            {noPercent}%
          </span>
        </div>
      </div>

      {/* Visual split bar */}
      <div className="mb-4 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="bg-green-400 transition-all duration-700"
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className="bg-red-400 transition-all duration-700"
          style={{ width: `${noPercent}%` }}
        />
      </div>

      {/* Volume + CTA row */}
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          VOL: {market.volume} trades
        </span>

        {!isResolved ? (
          <button
            onClick={() => onBet(market)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow-md active:scale-95"
          >
            Take Position
          </button>
        ) : (
          <span className="text-[10px] font-mono text-gray-500">
            Market closed
          </span>
        )}
      </div>
    </div>
  );
}
