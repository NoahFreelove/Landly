"use client";

import { useState, useEffect, useCallback } from "react";
import type { Unit } from "@/lib/types";
import { applyForUnit } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Modal,
  ModalBody,
} from "baseui/modal";
import { Button } from "baseui/button";
import { ProgressBar } from "baseui/progress-bar";

interface KlarnaCheckoutProps {
  unit: Unit | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type Step = "plan" | "verification" | "approved";

const PLANS = [
  { months: 3, label: "3 Months", badge: "QUICK PAY" },
  { months: 6, label: "6 Months", badge: "RECOMMENDED" },
  { months: 12, label: "12 Months", badge: "EXTENDED PLAN" },
] as const;

export default function KlarnaCheckout({
  unit,
  isOpen,
  onClose,
  onComplete,
}: KlarnaCheckoutProps) {
  const { token } = useAuth();
  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<number>(6);
  const [progress, setProgress] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setStep("plan");
      setSelectedPlan(6);
      setProgress(0);
      setApiError(null);
    }
  }, [isOpen]);

  // Verification progress bar
  useEffect(() => {
    if (step !== "verification") return;
    setProgress(0);
    const duration = 2000;
    const interval = 30;
    const increment = 100 / (duration / interval);
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = p + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [step]);

  // When progress reaches 100, call API and advance
  const handleApproval = useCallback(async () => {
    if (!unit || !token) return;
    try {
      await applyForUnit(token, unit.id, selectedPlan);
      setStep("approved");
    } catch (err: any) {
      setApiError(err.message || "Application recorded with discrepancies.");
      setStep("approved");
    }
  }, [unit, token, selectedPlan]);

  useEffect(() => {
    if (step === "verification" && progress >= 100) {
      const timeout = setTimeout(handleApproval, 400);
      return () => clearTimeout(timeout);
    }
  }, [step, progress, handleApproval]);

  if (!unit) return null;

  const installmentPayment = (
    (unit.monthly_rent_usd * selectedPlan * 1.35) /
    selectedPlan
  ).toFixed(2);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overrides={{
        Root: {
          style: {
            zIndex: 60,
          },
        },
        Dialog: {
          style: {
            backgroundColor: '#FFFFFF',
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
          },
        },
        DialogContainer: {
          style: {
            backdropFilter: 'blur(12px)',
          },
        },
        Close: {
          style: {
            color: '#9ca3af',
            ':hover': {
              color: '#4b5563',
            },
          },
        },
      }}
    >
      <ModalBody style={{ padding: 0, margin: 0 }}>
        {/* Klarna branding header */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFB3C7] text-sm font-black text-black">
              K
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Klarna Installments
              </p>
              <p className="text-[10px] text-gray-500">
                Powered by Landly Financial Services
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-6 pt-4">
          {(["plan", "verification", "approved"] as Step[]).map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div
                className={`h-1 w-full rounded-full transition-colors ${
                  i <=
                  ["plan", "verification", "approved"].indexOf(step)
                    ? "bg-[#FFB3C7]"
                    : "bg-gray-200"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* ---- STEP 1: Choose Plan ---- */}
          {step === "plan" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-gray-900">
                  Klarna Installment Plan
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Split your deposit for <strong className="text-gray-900">{unit.name}</strong> into
                  manageable installments. Interest rates are non-negotiable.
                </p>
              </div>

              {/* Plan options */}
              <div className="flex flex-col gap-3">
                {PLANS.map((plan) => {
                  const payment = (
                    (unit.monthly_rent_usd * plan.months * 1.35) /
                    plan.months
                  ).toFixed(2);
                  const isSelected = selectedPlan === plan.months;
                  return (
                    <button
                      key={plan.months}
                      onClick={() => setSelectedPlan(plan.months)}
                      className={`flex items-center justify-between rounded-xl p-4 text-left transition-all ring-1 ${
                        isSelected
                          ? "bg-[#FFB3C7]/10 ring-[#FFB3C7]/50 shadow-lg shadow-[#FFB3C7]/5"
                          : "bg-gray-50 ring-gray-200 hover:ring-[#FFB3C7]/20"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {plan.label}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              plan.badge === "EXTENDED PLAN"
                                ? "bg-gray-200 text-gray-600"
                                : plan.badge === "RECOMMENDED"
                                ? "bg-[#FFB3C7]/20 text-[#FFB3C7]"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {plan.badge}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {plan.months} monthly payments &bull; 35% APR
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-[#FFB3C7]">
                          ${payment}
                        </span>
                        <span className="text-xs text-gray-500">/mo</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-[10px] text-gray-400">
                By continuing, you agree to payment monitoring for the duration
                of your installment plan. Late payments may affect your Community
                Score.
              </p>

              <Button
                onClick={() => setStep("verification")}
                overrides={{
                  BaseButton: {
                    style: {
                      width: '100%',
                      height: '2.75rem',
                      backgroundColor: '#FFB3C7',
                      color: '#000000',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderTopLeftRadius: '0.75rem',
                      borderTopRightRadius: '0.75rem',
                      borderBottomLeftRadius: '0.75rem',
                      borderBottomRightRadius: '0.75rem',
                      ':hover': {
                        backgroundColor: '#ffc4da',
                      },
                    },
                  },
                }}
              >
                Continue
              </Button>
            </div>
          )}

          {/* ---- STEP 2: Verification ---- */}
          {step === "verification" && (
            <div className="flex flex-col items-center gap-6 py-8">
              {/* Spinner */}
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#FFB3C7]/20 border-t-[#FFB3C7]" />
                <span className="text-lg font-bold text-[#FFB3C7]">
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold uppercase tracking-tight text-gray-900">
                  Verifying Community Score...
                </h3>
                <p className="mt-2 text-xs text-gray-500">
                  Verifying your resident profile. This may take a moment.
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full">
                <ProgressBar
                  value={progress}
                  maxValue={100}
                  minValue={0}
                  showLabel={false}
                  overrides={{
                    BarContainer: {
                      style: {
                        backgroundColor: '#f3f4f6',
                        borderTopLeftRadius: '9999px',
                        borderTopRightRadius: '9999px',
                        borderBottomLeftRadius: '9999px',
                        borderBottomRightRadius: '9999px',
                        overflow: 'hidden',
                        marginLeft: '0',
                        marginRight: '0',
                      },
                    },
                    Bar: {
                      style: {
                        borderTopLeftRadius: '9999px',
                        borderTopRightRadius: '9999px',
                        borderBottomLeftRadius: '9999px',
                        borderBottomRightRadius: '9999px',
                      },
                    },
                    BarProgress: {
                      style: {
                        background: 'linear-gradient(90deg, rgba(255,179,199,0.6) 0%, #FFB3C7 100%)',
                        borderTopLeftRadius: '9999px',
                        borderTopRightRadius: '9999px',
                        borderBottomLeftRadius: '9999px',
                        borderBottomRightRadius: '9999px',
                      },
                    },
                  }}
                />
              </div>

              <div className="space-y-1 text-center text-[10px] text-gray-400">
                <p>{progress < 30 && "Verifying identity..."}</p>
                <p>
                  {progress >= 30 &&
                    progress < 60 &&
                    "Checking payment history..."}
                </p>
                <p>
                  {progress >= 60 &&
                    progress < 90 &&
                    "Calculating approval..."}
                </p>
                <p>
                  {progress >= 90 && "Finalizing..."}
                </p>
              </div>
            </div>
          )}

          {/* ---- STEP 3: Approved ---- */}
          {step === "approved" && (
            <div className="flex flex-col items-center gap-5 py-6">
              {/* Green checkmark */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-2 ring-green-200">
                <svg
                  className="h-10 w-10 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div className="text-center">
                <p className="text-2xl font-black uppercase tracking-tight text-green-600">
                  Approved
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome to <strong className="text-gray-900">{unit.name}</strong>
                </p>
              </div>

              {/* Summary */}
              <div className="w-full rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
                <div className="flex flex-col gap-3">
                  <Row label="Unit" value={unit.name} />
                  <Row label="Sector" value={unit.sector} />
                  <Row
                    label="Monthly Payment"
                    value={`$${installmentPayment}`}
                    highlight
                  />
                  <Row
                    label="Installments"
                    value={`${selectedPlan} months`}
                  />
                  <Row label="APR" value="35.00%" warn />
                  <Row
                    label="Total Cost"
                    value={`$${(parseFloat(installmentPayment) * selectedPlan).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  />
                </div>
              </div>

              <p className="text-center text-[10px] text-gray-400">
                Your Community Score has been noted. Late payments may result in
                Community Score adjustments and updated lease terms.
              </p>

              {apiError && (
                <p className="text-center text-[10px] text-amber-500">
                  System note: {apiError}
                </p>
              )}

              <Button
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                overrides={{
                  BaseButton: {
                    style: {
                      width: '100%',
                      height: '2.75rem',
                      backgroundColor: '#FFB3C7',
                      color: '#000000',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderTopLeftRadius: '0.75rem',
                      borderTopRightRadius: '0.75rem',
                      borderBottomLeftRadius: '0.75rem',
                      borderBottomRightRadius: '0.75rem',
                      ':hover': {
                        backgroundColor: '#ffc4da',
                      },
                    },
                  },
                }}
              >
                Accept Terms
              </Button>
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

function Row({
  label,
  value,
  highlight = false,
  warn = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
        {label}
      </span>
      <span
        className={`text-sm font-bold ${
          warn
            ? "text-red-500"
            : highlight
            ? "text-[#FFB3C7]"
            : "text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
