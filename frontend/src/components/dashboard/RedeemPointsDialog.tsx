"use client";

import { useState, useEffect } from "react";
import { Modal, ModalBody } from "baseui/modal";
import { useAuth } from "@/lib/auth";
import { redeemPointsForRent } from "@/lib/api";

interface RedeemPointsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pointsBalance: number;
  onRedeemed: () => void;
}

export default function RedeemPointsDialog({
  isOpen,
  onClose,
  pointsBalance,
  onRedeemed,
}: RedeemPointsDialogProps) {
  const { token } = useAuth();
  const [points, setPoints] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<{
    points_spent: number;
    dollar_credit: number;
    items_paid: number;
    applied_to: string[];
    remaining_points: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPoints("");
      setRedeeming(false);
      setResult(null);
    }
  }, [isOpen]);

  const parsedPoints = parseInt(points) || 0;
  const roundedPoints = Math.floor(parsedPoints / 100) * 100;
  const dollarValue = roundedPoints / 100;
  const canRedeem = roundedPoints >= 100 && roundedPoints <= pointsBalance;

  async function handleRedeem() {
    if (!token || !canRedeem) return;
    setRedeeming(true);
    try {
      const res = await redeemPointsForRent(token, roundedPoints);
      setResult(res);
      onRedeemed();
    } catch {
      // silently fail
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overrides={{
        Root: { style: { zIndex: 60 } },
        Dialog: {
          style: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#e5e7eb",
            borderRightColor: "#e5e7eb",
            borderBottomColor: "#e5e7eb",
            borderLeftColor: "#e5e7eb",
            borderTopWidth: "1px",
            borderRightWidth: "1px",
            borderBottomWidth: "1px",
            borderLeftWidth: "1px",
            borderTopStyle: "solid",
            borderRightStyle: "solid",
            borderBottomStyle: "solid",
            borderLeftStyle: "solid",
            borderTopLeftRadius: "1rem",
            borderTopRightRadius: "1rem",
            borderBottomLeftRadius: "1rem",
            borderBottomRightRadius: "1rem",
            maxWidth: "28rem",
            width: "100%",
            overflow: "hidden",
            padding: "0",
          },
        },
        DialogContainer: { style: { backdropFilter: "blur(12px)" } },
        Close: { style: { color: "#9ca3af", ":hover": { color: "#4b5563" } } },
      }}
    >
      <ModalBody style={{ padding: 0, margin: 0 }}>
        {/* Header */}
        <div className="border-b border-gray-200 bg-amber-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <span className="text-lg">{"\u2B50"}</span>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Redeem Points
              </p>
              <p className="text-[10px] text-gray-500">
                Balance: {pointsBalance.toLocaleString()} pts
              </p>
            </div>
          </div>
        </div>

        {/* Success state */}
        {result ? (
          <div className="p-6 text-center">
            <div className="mb-3 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <span className="text-2xl text-green-500">{"\u2713"}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              ${result.dollar_credit.toFixed(2)} Applied!
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {result.points_spent.toLocaleString()} points redeemed across{" "}
              {result.items_paid} item{result.items_paid !== 1 ? "s" : ""}
            </p>
            {result.applied_to.length > 0 && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                  Applied to
                </p>
                {result.applied_to.map((item, i) => (
                  <p key={i} className="text-xs text-gray-700 capitalize">
                    {item}
                  </p>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-3">
              Remaining: {result.remaining_points.toLocaleString()} pts
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex flex-col gap-4">
              {/* Exchange rate info */}
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold">
                  Exchange Rate
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  100 pts = $1.00
                </p>
                <p className="text-[10px] text-gray-400">
                  Every point counts toward your rent!
                </p>
              </div>

              {/* Points input */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 block mb-2">
                  Points to Redeem
                </label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="100"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 ring-1 ring-gray-200 text-lg font-bold text-gray-900 focus:ring-amber-400 focus:outline-none transition-all"
                />
              </div>

              {/* Quick amount buttons */}
              <div className="flex gap-2">
                {[500, 1000, 2500].map((v) => (
                  <button
                    key={v}
                    onClick={() => setPoints(v.toString())}
                    disabled={v > pointsBalance}
                    className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {v.toLocaleString()}
                  </button>
                ))}
                <button
                  onClick={() => setPoints((Math.floor(pointsBalance / 100) * 100).toString())}
                  disabled={pointsBalance < 100}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Max
                </button>
              </div>

              {/* Conversion display */}
              {parsedPoints > 0 && (
                <div className="rounded-lg bg-gray-50 ring-1 ring-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Points</span>
                    <span className="text-sm font-bold text-gray-900">
                      {roundedPoints.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="my-2 border-t border-gray-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      Rent Credit
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      ${dollarValue.toFixed(2)}
                    </span>
                  </div>
                  {parsedPoints !== roundedPoints && (
                    <p className="text-[9px] text-gray-400 mt-1">
                      Rounded down to nearest 100
                    </p>
                  )}
                </div>
              )}

              {/* Warning if insufficient */}
              {parsedPoints > pointsBalance && (
                <p className="text-xs text-red-500 text-center">
                  Insufficient points. You have {pointsBalance.toLocaleString()} pts.
                </p>
              )}

              <p className="text-[10px] text-gray-400 text-center">
                Applied to your oldest outstanding balance first.
              </p>

              <button
                onClick={handleRedeem}
                disabled={redeeming || !canRedeem}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wider px-6 py-3 rounded-xl transition-colors"
              >
                {redeeming
                  ? "Processing..."
                  : canRedeem
                  ? `Redeem ${roundedPoints.toLocaleString()} pts for $${dollarValue.toFixed(2)}`
                  : "Enter 100+ points"}
              </button>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
