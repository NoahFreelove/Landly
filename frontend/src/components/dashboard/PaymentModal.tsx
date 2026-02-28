"use client";

import { useState, useEffect } from "react";
import { Modal, ModalBody } from "baseui/modal";
import { useAuth } from "@/lib/auth";
import { makePayment, makeLumpSumPayment } from "@/lib/api";
import type { Payment, KlarnaDebt } from "@/lib/types";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: Payment[];
  klarnaDebts: KlarnaDebt[];
  totalDebt: number;
  onPaymentMade: () => void;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function PaymentModal({
  isOpen,
  onClose,
  payments,
  klarnaDebts,
  totalDebt,
  onPaymentMade,
}: PaymentModalProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"individual" | "lumpsum">("individual");
  const [lumpSumAmount, setLumpSumAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("individual");
      setLumpSumAmount("");
      setPaying(false);
      setSuccessMessage("");
    }
  }, [isOpen]);

  const outstandingPayments = payments.filter(
    (p) => p.status === "pending" || p.status === "overdue"
  );

  const activeKlarna = klarnaDebts.filter((d) => d.status === "active" || d.status === "overdue");

  async function handlePayIndividual(paymentId: number, amount: number) {
    if (!token) return;
    setPaying(true);
    setSuccessMessage("");
    try {
      await makePayment(token, paymentId, amount);
      setSuccessMessage("Payment processed successfully!");
      onPaymentMade();
    } catch (err: any) {
      setSuccessMessage("");
    } finally {
      setPaying(false);
    }
  }

  async function handleLumpSum() {
    if (!token || !lumpSumAmount) return;
    setPaying(true);
    setSuccessMessage("");
    try {
      const result = await makeLumpSumPayment(token, parseFloat(lumpSumAmount));
      setSuccessMessage(
        `$${result.amount_applied.toFixed(2)} applied across ${result.items_paid} item(s)`
      );
      setLumpSumAmount("");
      onPaymentMade();
    } catch (err: any) {
      setSuccessMessage("");
    } finally {
      setPaying(false);
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
            maxWidth: "32rem",
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
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-gray-900">Make a Payment</p>
              <p className="text-[10px] text-gray-500">
                Total balance: ${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("individual")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === "individual"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pay Individual Items
          </button>
          <button
            onClick={() => setActiveTab("lumpsum")}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === "lumpsum"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Lump Sum Payment
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mx-6 mb-4 mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 font-medium text-center">
            {successMessage}
          </div>
        )}

        {/* Tab 1: Individual Items */}
        {activeTab === "individual" && (
          <div className="p-6">
            {outstandingPayments.length === 0 && activeKlarna.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">All payments are up to date!</p>
            ) : (
              <>
                <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                  {outstandingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-xl p-4 bg-gray-50 ring-1 ring-gray-200"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-900 capitalize">
                          {payment.payment_type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          Due {formatDate(payment.due_date)}
                        </span>
                        {payment.accrued_interest > 0 && (
                          <span className="text-[10px] text-red-500">
                            +${payment.accrued_interest.toFixed(2)} interest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">
                          ${(payment.amount + payment.accrued_interest).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handlePayIndividual(payment.id, payment.amount)}
                          disabled={paying}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {activeKlarna.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                      Klarna Installments
                    </p>
                    {activeKlarna.map((debt) => (
                      <div
                        key={debt.id}
                        className="flex items-center justify-between rounded-xl p-4 bg-gray-50 ring-1 ring-gray-200"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-gray-900">{debt.item_name}</span>
                          <span className="text-[10px] text-gray-500">
                            {debt.installments_paid}/{debt.installments} paid
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          $
                          {(
                            (debt.total_amount / debt.installments) *
                            (debt.installments - debt.installments_paid)
                          ).toFixed(2)}{" "}
                          remaining
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: Lump Sum */}
        {activeTab === "lumpsum" && (
          <div className="p-6">
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 block mb-2">
                  Payment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={lumpSumAmount}
                    onChange={(e) => setLumpSumAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 ring-1 ring-gray-200 text-lg font-bold text-gray-900 focus:ring-blue-400 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400">
                This payment will be applied to your oldest outstanding debts first. Overdue
                balances are prioritized.
              </p>
              <button
                onClick={handleLumpSum}
                disabled={paying || !lumpSumAmount || parseFloat(lumpSumAmount) <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wider px-6 py-3 rounded-xl transition-colors"
              >
                {paying ? "Processing..." : "Submit Payment"}
              </button>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
