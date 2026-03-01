"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { addPoints } from "@/lib/api";

export default function WalletWidget() {
  const { user, token, updatePoints } = useAuth();
  const [flash, setFlash] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const balance = user?.landly_points ?? 0;

  // Listen for wallet update events (fired by BetModal after successful bet)
  const handleUpdate = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  }, []);

  useEffect(() => {
    window.addEventListener("landly:wallet:update", handleUpdate);
    return () => window.removeEventListener("landly:wallet:update", handleUpdate);
  }, [handleUpdate]);

  const handleAddPoints = async () => {
    const amt = parseInt(addAmount);
    if (!token || !amt || amt <= 0) return;
    setIsAdding(true);
    try {
      const res = await addPoints(token, amt);
      updatePoints(res.new_balance);
      setAddAmount("");
      setShowAdd(false);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    } catch {
      // silently fail
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all duration-300 ${
        flash ? "ring-2 ring-blue-300" : ""
      }`}
    >
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-50 blur-2xl" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Diamond icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            <span className="text-xl font-bold leading-none">{"\u2B50"}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Wallet
            </p>
            <p className="text-xs text-gray-500">Landly Points</p>
          </div>
        </div>

        <div className="text-right">
          <p
            className={`text-2xl font-bold tabular-nums tracking-tight transition-colors duration-300 ${
              flash ? "text-amber-500" : "text-gray-900"
            }`}
          >
            {balance.toLocaleString("en-US")}
            <span className="ml-1.5 text-sm font-semibold text-gray-400">
              pts
            </span>
          </p>
          <p className="text-[10px] font-mono text-gray-400">
            {"\u2248"} ${(balance / 100).toFixed(2)} rent credit
          </p>
        </div>
      </div>

      {/* Thin accent line */}
      <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-amber-200 to-transparent" />

      {/* Buy Points section */}
      <div className="mt-3">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full rounded-lg border border-dashed border-amber-300 bg-amber-50/50 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-50"
          >
            + Buy Points
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 placeholder-gray-300 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
            />
            <button
              onClick={handleAddPoints}
              disabled={isAdding || !addAmount || parseInt(addAmount) <= 0}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
            >
              {isAdding ? "..." : "Buy"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddAmount(""); }}
              className="rounded-lg px-2 py-2 text-xs text-gray-400 hover:text-gray-600"
            >
              {"\u2715"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
