"use client";

import type { Payment, KlarnaDebt } from "@/lib/types";

interface PaymentTableProps {
  payments: Payment[];
  klarnaDebts: KlarnaDebt[];
}

function statusPill(status: Payment["status"]) {
  const styles: Record<Payment["status"], string> = {
    paid: "bg-green-500/10 text-green-400 border-green-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    overdue: "bg-red-500/10 text-red-400 border-red-500/20",
    defaulted: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "paid"
            ? "bg-green-400"
            : status === "pending"
            ? "bg-amber-400"
            : "bg-red-400 animate-pulse"
        }`}
      />
      {status}
    </span>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function klarnaStatusBadge(debt: KlarnaDebt) {
  const isOverdue = debt.status === "overdue";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
        isOverdue
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : debt.status === "completed"
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-accent-klarna/10 text-accent-klarna border-accent-klarna/20"
      }`}
    >
      {debt.installments_paid}/{debt.installments} paid
    </span>
  );
}

export default function PaymentTable({
  payments,
  klarnaDebts,
}: PaymentTableProps) {
  return (
    <div className="bg-surface-card border border-[#2b2839] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2b2839] flex items-center justify-between">
        <h3 className="label-tracked">Payment Obligations</h3>
        <span className="text-[10px] font-mono text-zinc-500">
          {payments.length} record{payments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2b2839]">
              <th className="text-left px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Type
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Amount
              </th>
              <th className="text-center px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Status
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Due
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Interest
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[#2b2839]/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-3 text-zinc-200 font-medium capitalize text-xs">
                  {p.payment_type.replace("_", " ")}
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-100 text-xs">
                  ${p.amount.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  {statusPill(p.status)}
                </td>
                <td className="px-4 py-3 text-right text-zinc-400 font-mono text-xs">
                  {formatDate(p.due_date)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {p.accrued_interest > 0 ? (
                    <span className="text-red-400">
                      +${p.accrued_interest.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-zinc-600">--</span>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-600 text-xs"
                >
                  No payment records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Klarna Section */}
      {klarnaDebts.length > 0 && (
        <div className="border-t border-accent-klarna/20">
          <div className="px-5 py-3 flex items-center gap-2 border-b border-[#2b2839]">
            <span className="text-accent-klarna font-bold text-sm italic font-serif">
              Klarna.
            </span>
            <span className="label-tracked text-accent-klarna/70">
              Installment Debts
            </span>
          </div>
          <div className="divide-y divide-[#2b2839]/50">
            {klarnaDebts.map((debt) => (
              <div
                key={debt.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-accent-klarna/[0.02] transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-zinc-200 font-medium">
                    {debt.item_name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    ${debt.total_amount.toFixed(2)} total
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {klarnaStatusBadge(debt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
