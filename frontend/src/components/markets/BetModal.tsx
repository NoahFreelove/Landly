"use client";

import { useState, useEffect, useCallback } from "react";
import type { Market } from "@/lib/types";
import { placeBet } from "@/lib/api";
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

  if (!market) return null;

  const yesPercent = Math.round(market.yes_price * 100);
  const noPercent = Math.round(market.no_price * 100);

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
            backgroundColor: '#1d1c27',
            borderTopColor: '#2b2839',
            borderRightColor: '#2b2839',
            borderBottomColor: '#2b2839',
            borderLeftColor: '#2b2839',
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
            boxShadow: '0 25px 50px -12px rgba(50, 17, 212, 0.1)',
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
                            borderTopColor: '#00cc66',
                            borderRightColor: '#00cc66',
                            borderBottomColor: '#00cc66',
                            borderLeftColor: '#00cc66',
                            backgroundColor: 'rgba(0, 204, 102, 0.15)',
                            color: '#00cc66',
                          }
                        : {
                            borderTopColor: '#3f3f46',
                            borderRightColor: '#3f3f46',
                            borderBottomColor: '#3f3f46',
                            borderLeftColor: '#3f3f46',
                            backgroundColor: 'transparent',
                            color: '#71717a',
                          }),
                      ':hover': position === "yes"
                        ? { backgroundColor: 'rgba(0, 204, 102, 0.15)' }
                        : { borderTopColor: '#52525b', borderRightColor: '#52525b', borderBottomColor: '#52525b', borderLeftColor: '#52525b', color: '#a1a1aa' },
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
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                          }
                        : {
                            borderTopColor: '#3f3f46',
                            borderRightColor: '#3f3f46',
                            borderBottomColor: '#3f3f46',
                            borderLeftColor: '#3f3f46',
                            backgroundColor: 'transparent',
                            color: '#71717a',
                          }),
                      ':hover': position === "no"
                        ? { backgroundColor: 'rgba(239, 68, 68, 0.15)' }
                        : { borderTopColor: '#52525b', borderRightColor: '#52525b', borderBottomColor: '#52525b', borderLeftColor: '#52525b', color: '#a1a1aa' },
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
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Amount (LDLY)
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
                <span className="text-sm font-semibold text-zinc-500">LDLY</span>
              )}
              overrides={{
                Root: {
                  style: {
                    backgroundColor: '#131022',
                    borderTopColor: '#3f3f46',
                    borderRightColor: '#3f3f46',
                    borderBottomColor: '#3f3f46',
                    borderLeftColor: '#3f3f46',
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
                    color: '#ffffff',
                    backgroundColor: '#131022',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    '::placeholder': { color: '#52525b' },
                  },
                },
                InputContainer: {
                  style: {
                    backgroundColor: '#131022',
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
                        borderTopColor: '#3f3f46',
                        borderRightColor: '#3f3f46',
                        borderBottomColor: '#3f3f46',
                        borderLeftColor: '#3f3f46',
                        backgroundColor: 'transparent',
                        color: '#a1a1aa',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        ':hover': {
                          borderTopColor: 'rgba(50, 17, 212, 0.5)',
                          borderRightColor: 'rgba(50, 17, 212, 0.5)',
                          borderBottomColor: 'rgba(50, 17, 212, 0.5)',
                          borderLeftColor: 'rgba(50, 17, 212, 0.5)',
                          color: '#ffffff',
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
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || parsedAmount <= 0}
            isLoading={isSubmitting}
            overrides={{
              BaseButton: {
                style: {
                  width: '100%',
                  backgroundColor: '#3211d4',
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
                  boxShadow: '0 10px 15px -3px rgba(50, 17, 212, 0.25)',
                  ':hover': {
                    backgroundColor: '#2a0eb3',
                    boxShadow: '0 20px 25px -5px rgba(50, 17, 212, 0.3)',
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
            {isSubmitting ? "Processing..." : "Confirm Bet"}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
