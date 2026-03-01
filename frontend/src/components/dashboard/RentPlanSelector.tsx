"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody } from "baseui/modal";
import { selectRentPlan } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  unitName: string;
  monthlyRent: number;
  onPlanSelected: () => void;
}

const PLANS = [
  {
    type: "standard",
    name: "Standard",
    months: 3,
    apr: 18,
    badge: "Best Value",
    badgeColor: "bg-green-50 text-green-700 border-green-200",
  },
  {
    type: "flexible",
    name: "Flexible",
    months: 6,
    apr: 24,
    badge: "Most Popular",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200",
    featured: true,
  },
  {
    type: "freedom",
    name: "Freedom",
    months: 12,
    apr: 35,
    badge: "Lowest Payment",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
];

export default function RentPlanSelector({ isOpen, onClose, unitName, monthlyRent, onPlanSelected }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullPay, setShowFullPay] = useState(false);

  async function handleSelect(planType: string) {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await selectRentPlan(token, planType);
      onPlanSelected();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overrides={{
        Dialog: { style: { borderRadius: "16px", maxWidth: "720px", width: "100%" } },
      }}
    >
      <ModalHeader>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Choose Your Payment Plan</h2>
          <p className="text-xs text-gray-500 mt-1">
            {unitName} · ${monthlyRent.toLocaleString()}/month
          </p>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {PLANS.map((plan) => {
            const monthly = monthlyRent / plan.months;
            return (
              <div
                key={plan.type}
                className={`relative rounded-xl border-2 p-4 text-center cursor-pointer transition-all hover:shadow-md ${
                  plan.featured
                    ? "border-pink-300 bg-pink-50/30"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => !loading && handleSelect(plan.type)}
              >
                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border mb-3 ${plan.badgeColor}`}>
                  {plan.badge}
                </span>

                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  {plan.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{plan.months} months</p>

                <p className="text-2xl font-bold text-gray-900 mt-3">
                  ${monthly.toFixed(0)}
                  <span className="text-xs font-normal text-gray-400">/mo</span>
                </p>

                <p className="text-[10px] text-gray-400 mt-1">{plan.apr}% APR</p>

                <button
                  disabled={loading}
                  className={`w-full mt-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    plan.featured
                      ? "bg-pink-200 text-pink-800 hover:bg-pink-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {loading ? "Processing..." : "Select"}
                </button>

                {plan.featured && (
                  <img src="/klarna.png" alt="Klarna" className="h-4 mx-auto mt-2 opacity-60" />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center mb-3">{error}</p>
        )}

        {/* Buried full-pay option */}
        <div className="text-center border-t border-gray-100 pt-3">
          {!showFullPay ? (
            <button
              onClick={() => setShowFullPay(true)}
              className="text-[10px] text-gray-300 hover:text-gray-400 transition-colors"
            >
              Pay ${monthlyRent.toLocaleString()} in full ›
            </button>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">
                Are you sure? <span className="font-medium">94% of residents</span> prefer the flexibility of installments.
              </p>
              <button
                onClick={() => handleSelect("standard")}
                className="text-[10px] text-gray-400 underline"
              >
                Yes, pay in full
              </button>
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
