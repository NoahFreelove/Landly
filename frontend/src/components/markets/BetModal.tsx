"use client";

import { useState, useEffect, useCallback } from "react";
import type { Market } from "@/lib/types";
import { placeBet, addTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Modal,
  ModalBody,
} from "baseui/modal";
import { Button, KIND, SIZE as BUTTON_SIZE } from "baseui/button";
import { Input } from "baseui/input";

interface BetModalProps {
  market: Market | null;
  isOpen: boolean;
  onClose: () => void;
  onBetPlaced: () => void;
}

type Position = "yes" | "no";
type KlarnaStep = "select" | "verifying" | "done";

export default function BetModal({
  market,
  isOpen,
  onClose,
  onBetPlaced,
}: BetModalProps) {
  const { user, token, updateBalance } = useAuth();
  const [position, setPosition] = useState<Position>("yes");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Klarna financing state
  const [showKlarna, setShowKlarna] = useState(false);
  const [klarnaStep, setKlarnaStep] = useState<KlarnaStep>("select");
  const [klarnaPlan, setKlarnaPlan] = useState<number>(3);
  const [klarnaProgress, setKlarnaProgress] = useState(0);

  const balance = user?.token_balance ?? 0;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition("yes");
      setAmount("");
      setError(null);
      setShowConfirmation(false);
      setIsSubmitting(false);
      setShowKlarna(false);
      setKlarnaStep("select");
      setKlarnaPlan(3);
      setKlarnaProgress(0);
    }
  }, [isOpen]);

  const parsedAmount = parseFloat(amount) || 0;
  const price = market
    ? position === "yes"
      ? market.yes_price
      : market.no_price
    : 0;
  const shares = price > 0 ? parsedAmount / price : 0;
  const potentialPayout = shares;
  const profit = potentialPayout - parsedAmount;
  const deficit = parsedAmount - balance;
  const isInsufficient = parsedAmount > 0 && parsedAmount > balance;

  const handleSubmit = useCallback(async () => {
    if (!market || !token || parsedAmount <= 0 || isInsufficient) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await placeBet(token, market.id, position, parsedAmount);

      // Optimistically update balance
      updateBalance(balance - parsedAmount);

      // Dispatch wallet update event for flash animation
      window.dispatchEvent(new CustomEvent("landly:wallet:update"));

      setShowConfirmation(true);
      setTimeout(() => {
        onBetPlaced();
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Position placement failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [market, token, parsedAmount, position, isInsufficient, balance, updateBalance, onBetPlaced, onClose]);

  // Klarna financing flow
  const handleKlarnaFinance = useCallback(async () => {
    if (!token || deficit <= 0) return;

    setKlarnaStep("verifying");
    setKlarnaProgress(0);

    // Simulate verification progress bar
    const steps = [10, 25, 40, 55, 70, 85, 95, 100];
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 300));
      setKlarnaProgress(steps[i]);
    }

    try {
      const res = await addTokens(token, Math.ceil(deficit), klarnaPlan);
      updateBalance(res.new_balance);
      window.dispatchEvent(new CustomEvent("landly:wallet:update"));
      setKlarnaStep("done");

      // Now auto-place the bet
      await new Promise((r) => setTimeout(r, 500));
      if (market) {
        await placeBet(token, market.id, position, parsedAmount);
        updateBalance(res.new_balance - parsedAmount);
        window.dispatchEvent(new CustomEvent("landly:wallet:update"));
      }

      setShowKlarna(false);
      setShowConfirmation(true);
      setTimeout(() => {
        onBetPlaced();
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Klarna financing failed."
      );
      setShowKlarna(false);
    }
  }, [token, deficit, klarnaPlan, market, position, parsedAmount, updateBalance, onBetPlaced, onClose]);

  if (!market) return null;

  const yesPercent = Math.round(market.yes_price * 100);
  const noPercent = Math.round(market.no_price * 100);

  const apr = 0.35;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      overrides={{
        Root: {
          style: {
            zIndex: 50,
          },
        },
        Dialog: {
          style: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e5e7eb',
            borderRightColor: '#e5e7eb',
            borderBottomColor: '#e5e7eb',
            borderLeftColor: '#e5e7eb',
            borderTopWidth: '1px',
            borderRightWidth: '1px',
            borderBottomWidth: '1px',
            borderLeftWidth: '1px',
            borderTopStyle: 'solid',
            borderRightStyle: 'solid',
            borderBottomStyle: 'solid',
            borderLeftStyle: 'solid',
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem',
            borderBottomLeftRadius: '1rem',
            borderBottomRightRadius: '1rem',
            maxWidth: '28rem',
            width: '100%',
            overflow: 'hidden',
            padding: '0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
          },
        },
        DialogContainer: {
          style: {
            backdropFilter: 'blur(4px)',
          },
        },
        Close: {
          style: {
            display: 'none',
          },
        },
      }}
    >
      <ModalBody style={{ padding: 0, margin: 0 }}>
        {/* Confirmation overlay */}
        {showConfirmation && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <span className="text-3xl text-green-500">{"\u2713"}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">Position Confirmed</p>
            <p className="text-sm text-gray-500">
              {parsedAmount.toFixed(2)} LDLY on{" "}
              {position.toUpperCase()}
            </p>
          </div>
        )}

        {/* Klarna financing overlay */}
        {showKlarna && (
          <div className="absolute inset-0 z-20 flex flex-col bg-white">
            <div className="border-b border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/klarna.png" alt="Klarna" className="h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <p className="text-sm font-bold text-gray-900">Finance with Klarna</p>
                </div>
                {klarnaStep === "select" && (
                  <button
                    onClick={() => setShowKlarna(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    {"\u2715"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 p-5">
              {klarnaStep === "select" && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-pink-50 border border-pink-100 p-3">
                    <p className="text-xs font-medium text-pink-600">Financing</p>
                    <p className="text-lg font-bold text-gray-900">{Math.ceil(deficit)} LDLY</p>
                    <p className="text-[10px] text-gray-500">to cover your position deficit</p>
                  </div>

                  <p className="text-xs font-medium text-gray-500">Select Payment Plan</p>

                  {[3, 6, 12].map((months) => {
                    const total = Math.ceil(deficit) * (1 + apr * months / 12);
                    const monthly = total / months;
                    return (
                      <button
                        key={months}
                        onClick={() => setKlarnaPlan(months)}
                        className={`w-full rounded-lg border p-3 text-left transition-all ${
                          klarnaPlan === months
                            ? "border-pink-400 bg-pink-50/50 ring-1 ring-pink-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{months} months</p>
                            <p className="text-[10px] text-gray-500">35% APR</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{monthly.toFixed(2)} LDLY/mo</p>
                            <p className="text-[10px] text-gray-400">Total: {total.toFixed(2)} LDLY</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <Button
                    onClick={handleKlarnaFinance}
                    overrides={{
                      BaseButton: {
                        style: {
                          width: '100%',
                          backgroundColor: '#ec4899',
                          paddingTop: '0.875rem',
                          paddingBottom: '0.875rem',
                          borderTopLeftRadius: '0.5rem',
                          borderTopRightRadius: '0.5rem',
                          borderBottomLeftRadius: '0.5rem',
                          borderBottomRightRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#ffffff',
                          ':hover': {
                            backgroundColor: '#db2777',
                          },
                        },
                      },
                    }}
                  >
                    Finance & Place Position
                  </Button>
                </div>
              )}

              {klarnaStep === "verifying" && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
                  <p className="mb-1 text-sm font-bold text-gray-900">Verifying with Klarna...</p>
                  <p className="mb-4 text-xs text-gray-500">Processing your financing application</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-pink-500 transition-all duration-300"
                      style={{ width: `${klarnaProgress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-mono text-gray-400">{klarnaProgress}%</p>
                </div>
              )}

              {klarnaStep === "done" && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                    <span className="text-2xl text-green-500">{"\u2713"}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">Approved! Placing position...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Take Position
            </p>
            <button
              onClick={() => !isSubmitting && onClose()}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              {"\u2715"}
            </button>
          </div>
          <h2 className="mt-2 text-base font-bold leading-snug text-gray-900">
            {market.question}
          </h2>
          {/* Balance display */}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Balance:</span>
            <span className="text-xs font-bold tabular-nums text-gray-700">
              {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LDLY
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">
          {/* Current odds */}
          <div className="flex items-center justify-center gap-4 rounded-lg bg-gray-50 px-4 py-3">
            <div className="text-center">
              <p className="text-xs font-bold text-green-600">YES</p>
              <p className="text-xl font-bold tabular-nums text-green-600">
                {yesPercent}%
              </p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-xs font-bold text-red-500">NO</p>
              <p className="text-xl font-bold tabular-nums text-red-500">
                {noPercent}%
              </p>
            </div>
          </div>

          {/* Position selector */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">
              Your Position
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setPosition("yes")}
                kind={KIND.secondary}
                overrides={{
                  BaseButton: {
                    style: {
                      flex: 1,
                      borderTopWidth: '2px',
                      borderRightWidth: '2px',
                      borderBottomWidth: '2px',
                      borderLeftWidth: '2px',
                      borderTopStyle: 'solid',
                      borderRightStyle: 'solid',
                      borderBottomStyle: 'solid',
                      borderLeftStyle: 'solid',
                      borderTopLeftRadius: '0.5rem',
                      borderTopRightRadius: '0.5rem',
                      borderBottomLeftRadius: '0.5rem',
                      borderBottomRightRadius: '0.5rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.875rem',
                      ...(position === "yes"
                        ? {
                            borderTopColor: '#16a34a',
                            borderRightColor: '#16a34a',
                            borderBottomColor: '#16a34a',
                            borderLeftColor: '#16a34a',
                            backgroundColor: '#f0fdf4',
                            color: '#16a34a',
                          }
                        : {
                            borderTopColor: '#e5e7eb',
                            borderRightColor: '#e5e7eb',
                            borderBottomColor: '#e5e7eb',
                            borderLeftColor: '#e5e7eb',
                            backgroundColor: '#ffffff',
                            color: '#9ca3af',
                          }),
                      ':hover': position === "yes"
                        ? { backgroundColor: '#f0fdf4' }
                        : { borderTopColor: '#d1d5db', borderRightColor: '#d1d5db', borderBottomColor: '#d1d5db', borderLeftColor: '#d1d5db', color: '#6b7280' },
                    },
                  },
                }}
              >
                <span className="text-lg leading-none mr-2">{"\u2191"}</span>
                Yes
              </Button>
              <Button
                onClick={() => setPosition("no")}
                kind={KIND.secondary}
                overrides={{
                  BaseButton: {
                    style: {
                      flex: 1,
                      borderTopWidth: '2px',
                      borderRightWidth: '2px',
                      borderBottomWidth: '2px',
                      borderLeftWidth: '2px',
                      borderTopStyle: 'solid',
                      borderRightStyle: 'solid',
                      borderBottomStyle: 'solid',
                      borderLeftStyle: 'solid',
                      borderTopLeftRadius: '0.5rem',
                      borderTopRightRadius: '0.5rem',
                      borderBottomLeftRadius: '0.5rem',
                      borderBottomRightRadius: '0.5rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.875rem',
                      ...(position === "no"
                        ? {
                            borderTopColor: '#ef4444',
                            borderRightColor: '#ef4444',
                            borderBottomColor: '#ef4444',
                            borderLeftColor: '#ef4444',
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                          }
                        : {
                            borderTopColor: '#e5e7eb',
                            borderRightColor: '#e5e7eb',
                            borderBottomColor: '#e5e7eb',
                            borderLeftColor: '#e5e7eb',
                            backgroundColor: '#ffffff',
                            color: '#9ca3af',
                          }),
                      ':hover': position === "no"
                        ? { backgroundColor: '#fef2f2' }
                        : { borderTopColor: '#d1d5db', borderRightColor: '#d1d5db', borderBottomColor: '#d1d5db', borderLeftColor: '#d1d5db', color: '#6b7280' },
                    },
                  },
                }}
              >
                <span className="text-lg leading-none mr-2">{"\u2193"}</span>
                No
              </Button>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-500">
              Position Amount (LDLY)
            </label>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              value={amount}
              onChange={(e) => {
                setAmount((e.target as HTMLInputElement).value);
                setError(null);
              }}
              placeholder="0.00"
              endEnhancer={() => (
                <span className="text-sm font-semibold text-gray-400">LDLY</span>
              )}
              overrides={{
                Root: {
                  style: {
                    backgroundColor: '#ffffff',
                    borderTopColor: isInsufficient ? '#fca5a5' : '#e5e7eb',
                    borderRightColor: isInsufficient ? '#fca5a5' : '#e5e7eb',
                    borderBottomColor: isInsufficient ? '#fca5a5' : '#e5e7eb',
                    borderLeftColor: isInsufficient ? '#fca5a5' : '#e5e7eb',
                    borderTopWidth: '1px',
                    borderRightWidth: '1px',
                    borderBottomWidth: '1px',
                    borderLeftWidth: '1px',
                    borderTopStyle: 'solid' as const,
                    borderRightStyle: 'solid' as const,
                    borderBottomStyle: 'solid' as const,
                    borderLeftStyle: 'solid' as const,
                    borderTopLeftRadius: '0.5rem',
                    borderTopRightRadius: '0.5rem',
                    borderBottomLeftRadius: '0.5rem',
                    borderBottomRightRadius: '0.5rem',
                  },
                },
                Input: {
                  style: {
                    color: '#111827',
                    backgroundColor: '#ffffff',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    '::placeholder': { color: '#d1d5db' },
                  },
                },
                InputContainer: {
                  style: {
                    backgroundColor: '#ffffff',
                  },
                },
              }}
            />
            {/* Quick amount buttons */}
            <div className="mt-2 flex gap-2">
              {[10, 50, 100, 250].map((v) => (
                <Button
                  key={v}
                  onClick={() => {
                    setAmount(v.toString());
                    setError(null);
                  }}
                  kind={KIND.secondary}
                  size={BUTTON_SIZE.compact}
                  overrides={{
                    BaseButton: {
                      style: {
                        flex: 1,
                        borderTopWidth: '1px',
                        borderRightWidth: '1px',
                        borderBottomWidth: '1px',
                        borderLeftWidth: '1px',
                        borderTopStyle: 'solid',
                        borderRightStyle: 'solid',
                        borderBottomStyle: 'solid',
                        borderLeftStyle: 'solid',
                        borderTopColor: '#e5e7eb',
                        borderRightColor: '#e5e7eb',
                        borderBottomColor: '#e5e7eb',
                        borderLeftColor: '#e5e7eb',
                        backgroundColor: '#ffffff',
                        color: '#6b7280',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        ':hover': {
                          borderTopColor: '#3b82f6',
                          borderRightColor: '#3b82f6',
                          borderBottomColor: '#3b82f6',
                          borderLeftColor: '#3b82f6',
                          color: '#3b82f6',
                          backgroundColor: '#eff6ff',
                        },
                      },
                    },
                  }}
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>

          {/* Insufficient balance warning */}
          {isInsufficient && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500 text-sm">{"\u26A0"}</span>
                <p className="text-xs font-bold text-amber-700">Insufficient LDLY Balance</p>
              </div>
              <p className="text-xs text-amber-600 mb-3">
                You need <span className="font-bold">{deficit.toFixed(2)} more LDLY</span> to place this position.
              </p>
              <button
                onClick={() => setShowKlarna(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-500 py-2.5 text-xs font-bold text-white transition-colors hover:bg-pink-600"
              >
                <img src="/klarna.png" alt="" className="h-4 brightness-0 invert" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                Finance with Klarna
              </button>
            </div>
          )}

          {/* Potential payout calculation */}
          {parsedAmount > 0 && !isInsufficient && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Shares</span>
                <span className="font-mono text-gray-900">
                  {shares.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>Avg Price</span>
                <span className="font-mono text-gray-900">
                  {(price * 100).toFixed(0)}% ({price.toFixed(2)} LDLY)
                </span>
              </div>
              <div className="my-2 border-t border-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                  Potential Payout
                </span>
                <span className="text-base font-bold text-green-600">
                  {potentialPayout.toFixed(2)} LDLY
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Profit</span>
                <span
                  className={`text-xs font-bold ${
                    profit > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {profit > 0 ? "+" : ""}
                  {profit.toFixed(2)} LDLY
                </span>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-center text-[10px] font-medium uppercase tracking-wider text-gray-400">
            All positions are final. Past performance is not indicative of future results.
          </p>

          {/* Error display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || parsedAmount <= 0 || isInsufficient}
            isLoading={isSubmitting}
            overrides={{
              BaseButton: {
                style: {
                  width: '100%',
                  backgroundColor: isInsufficient ? '#9ca3af' : '#3b82f6',
                  paddingTop: '0.875rem',
                  paddingBottom: '0.875rem',
                  borderTopLeftRadius: '0.5rem',
                  borderTopRightRadius: '0.5rem',
                  borderBottomLeftRadius: '0.5rem',
                  borderBottomRightRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#ffffff',
                  boxShadow: isInsufficient ? 'none' : '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                  ':hover': {
                    backgroundColor: isInsufficient ? '#9ca3af' : '#2563eb',
                    boxShadow: isInsufficient ? 'none' : '0 10px 15px -3px rgba(59, 130, 246, 0.25)',
                  },
                  ':disabled': {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                    boxShadow: 'none',
                  },
                },
              },
            }}
          >
            {isSubmitting ? "Processing..." : isInsufficient ? "Insufficient Balance" : "Confirm Position"}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
