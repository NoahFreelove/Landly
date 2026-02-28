"use client";

import { useState, useCallback, useEffect } from "react";

const INITIAL_BALANCE = 1000;
const STORAGE_KEY = "landly_wallet_balance";

/**
 * Self-contained crypto wallet widget displaying LDLY balance.
 *
 * Exposes a custom event so other components (BetModal) can deduct funds
 * by dispatching a `landly:wallet:debit` CustomEvent with `detail.amount`.
 */
export default function WalletWidget() {
  const [balance, setBalance] = useState<number>(() => {
    if (typeof window === "undefined") return INITIAL_BALANCE;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseFloat(stored) : INITIAL_BALANCE;
  });
  const [flash, setFlash] = useState(false);

  // Persist balance changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, balance.toString());
  }, [balance]);

  // Listen for debit events from BetModal
  const handleDebit = useCallback((e: Event) => {
    const amount = (e as CustomEvent).detail?.amount;
    if (typeof amount === "number" && amount > 0) {
      setBalance((prev) => {
        const next = Math.max(0, prev - amount);
        return parseFloat(next.toFixed(2));
      });
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("landly:wallet:debit", handleDebit);
    return () => window.removeEventListener("landly:wallet:debit", handleDebit);
  }, [handleDebit]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#2b2839] bg-surface-card p-5 transition-all duration-300 ${
        flash ? "ring-2 ring-accent-green/50" : ""
      }`}
    >
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-green/5 blur-2xl" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Diamond / ETH-style icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-green/10 text-accent-green">
            <span className="text-xl font-bold leading-none">{"\u25C6"}</span>
          </div>
          <div>
            <p className="label-tracked text-[10px] text-zinc-500">
              Crypto Wallet
            </p>
            <p className="text-xs text-zinc-500">Landly Token (LDLY)</p>
          </div>
        </div>

        <div className="text-right">
          <p
            className={`text-2xl font-bold tabular-nums tracking-tight transition-colors duration-300 ${
              flash ? "text-accent-green" : "text-white"
            }`}
          >
            {balance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className="ml-1.5 text-sm font-semibold text-zinc-500">
              LDLY
            </span>
          </p>
          <p className="text-[10px] font-mono text-zinc-600">
            {"\u2248"} ${(balance * 0.0042).toFixed(2)} USD
          </p>
        </div>
      </div>

      {/* Thin accent line at bottom */}
      <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-accent-green/30 to-transparent" />
    </div>
  );
}
