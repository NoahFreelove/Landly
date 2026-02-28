"use client";

import { useState, useEffect, useCallback } from "react";
import type { Market } from "@/lib/types";
import { placeBet } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface BetModalProps {
  market: Market | null;
  isOpen: boolean;
  onClose: () => void;
  onBetPlaced: () => void;
}

type Position = "yes" | "no";

export default function BetModal({
  market,
  isOpen,
  onClose,
  onBetPlaced,
}: BetModalProps) {
  const { token } = useAuth();
  const [position, setPosition] = useState<Position>("yes");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition("yes");
      setAmount("");
      setError(null);
      setShowConfirmation(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, isSubmitting, onClose]);

  const parsedAmount = parseFloat(amount) || 0;
  const price = market
    ? position === "yes"
      ? market.yes_price
      : market.no_price
    : 0;
  const shares = price > 0 ? parsedAmount / price : 0;
  const potentialPayout = shares; // Each share pays out $1 if correct
  const profit = potentialPayout - parsedAmount;

  const handleSubmit = useCallback(async () => {
    if (!market || !token || parsedAmount <= 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await placeBet(token, market.id, position, parsedAmount);

      // Dispatch wallet debit event
      window.dispatchEvent(
        new CustomEvent("landly:wallet:debit", {
          detail: { amount: parsedAmount },
        })
      );

      setShowConfirmation(true);
      setTimeout(() => {
        onBetPlaced();
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Bet placement failed. The system remembers."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [market, token, parsedAmount, position, onBetPlaced, onClose]);

  if (!isOpen || !market) return null;

  const yesPercent = Math.round(market.yes_price * 100);
  const noPercent = Math.round(market.no_price * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-[#2b2839] bg-surface-card shadow-2xl shadow-primary/10">
        {/* Confirmation overlay */}
        {showConfirmation && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-card/95 backdrop-blur-sm">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent-green/20">
              <span className="text-3xl text-accent-green">{"\u2713"}</span>
            </div>
            <p className="text-lg font-bold text-white">Bet Confirmed</p>
            <p className="text-sm text-zinc-400">
              {parsedAmount.toFixed(2)} LDLY on{" "}
              {position.toUpperCase()}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="border-b border-[#2b2839] p-5">
          <div className="flex items-center justify-between">
            <p className="label-tracked text-[10px] text-zinc-500">
              Place Prediction
            </p>
            <button
              onClick={() => !isSubmitting && onClose()}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
            >
              {"\u2715"}
            </button>
          </div>
          <h2 className="mt-2 text-base font-bold leading-snug text-white">
            {market.question}
          </h2>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">
          {/* Current odds */}
          <div className="flex items-center justify-center gap-4 rounded-lg bg-white/[0.03] px-4 py-3">
            <div className="text-center">
              <p className="text-xs font-bold text-accent-green">YES</p>
              <p className="text-xl font-bold tabular-nums text-green-300">
                {yesPercent}%
              </p>
            </div>
            <div className="h-8 w-px bg-zinc-700" />
            <div className="text-center">
              <p className="text-xs font-bold text-red-400">NO</p>
              <p className="text-xl font-bold tabular-nums text-red-300">
                {noPercent}%
              </p>
            </div>
          </div>

          {/* Position selector */}
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">
              Your Position
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPosition("yes")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
                  position === "yes"
                    ? "border-accent-green bg-accent-green/15 text-accent-green shadow-lg shadow-accent-green/10"
                    : "border-zinc-700 bg-transparent text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                }`}
              >
                <span className="text-lg leading-none">{"\u2191"}</span>
                Yes
              </button>
              <button
                onClick={() => setPosition("no")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
                  position === "no"
                    ? "border-red-500 bg-red-500/15 text-red-400 shadow-lg shadow-red-500/10"
                    : "border-zinc-700 bg-transparent text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                }`}
              >
                <span className="text-lg leading-none">{"\u2193"}</span>
                No
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Amount (LDLY)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-700 bg-surface-page px-4 py-3 pr-16 text-lg font-bold tabular-nums text-white placeholder-zinc-600 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
                LDLY
              </span>
            </div>
            {/* Quick amount buttons */}
            <div className="mt-2 flex gap-2">
              {[10, 50, 100, 250].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setAmount(v.toString());
                    setError(null);
                  }}
                  className="flex-1 rounded border border-zinc-700 py-1 text-xs font-bold text-zinc-400 transition-colors hover:border-primary/50 hover:text-white"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Potential payout calculation */}
          {parsedAmount > 0 && (
            <div className="rounded-lg border border-zinc-700/50 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Shares</span>
                <span className="font-mono text-zinc-300">
                  {shares.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
                <span>Avg Price</span>
                <span className="font-mono text-zinc-300">
                  {(price * 100).toFixed(0)}% ({price.toFixed(2)} LDLY)
                </span>
              </div>
              <div className="my-2 border-t border-zinc-700/50" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">
                  Potential Payout
                </span>
                <span className="text-base font-bold text-accent-green">
                  {potentialPayout.toFixed(2)} LDLY
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">Profit</span>
                <span
                  className={`text-xs font-bold ${
                    profit > 0 ? "text-accent-green" : "text-red-400"
                  }`}
                >
                  {profit > 0 ? "+" : ""}
                  {profit.toFixed(2)} LDLY
                </span>
              </div>
            </div>
          )}

          {/* Warning */}
          <p className="text-center text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            All bets are final. The house always wins.
          </p>

          {/* Error display */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || parsedAmount <= 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </>
            ) : (
              "Confirm Bet"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
