"use client";

import type { DebtSpiralData } from "@/lib/types";

const PLAN_COLORS: Record<string, string> = {
  standard: "#3B82F6",
  flexible: "#FFB3C7",
  freedom: "#F59E0B",
};

interface Props {
  data: DebtSpiralData;
}

export default function DebtSpiralTimeline({ data }: Props) {
  const { plans, active_count, this_month_total, projected_debt_free } = data;

  const debtFreeDate = projected_debt_free
    ? new Date(projected_debt_free).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "calculating...";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Payment Plans Overview
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-pink-50 text-pink-700 border border-pink-200">
              {active_count} Active Plan{active_count !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-gray-400">
              Debt-free by{" "}
              <span className="text-gray-700 font-medium">{debtFreeDate}</span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">This Month</span>
          <p className="text-2xl font-bold text-gray-900">
            ${this_month_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Stacked plan bars */}
      <div className="space-y-1.5 mb-4">
        {plans.map((plan) => {
          const progress = plan.installments > 0 ? plan.installments_paid / plan.installments : 0;
          const remaining = plan.installments - plan.installments_paid;
          const color = PLAN_COLORS[plan.plan_type || "flexible"] || "#94A3B8";

          return (
            <div key={plan.id} className="group relative">
              <div className="flex items-center gap-3">
                <div className="w-24 flex-shrink-0 text-right">
                  <span className="text-[10px] font-medium text-gray-500">
                    {plan.rent_month || "Other"}
                  </span>
                </div>
                <div className="flex-1 h-6 bg-gray-50 rounded-md overflow-hidden relative border border-gray-100">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{
                      width: `${Math.max(8, progress * 100)}%`,
                      backgroundColor: color,
                      opacity: plan.status === "overdue" ? 1 : 0.7,
                    }}
                  />
                  {plan.status === "overdue" && (
                    <div className="absolute inset-0 border-2 border-red-400 rounded-md animate-pulse" />
                  )}
                  <div className="absolute inset-0 flex items-center px-2 justify-between">
                    <span className="text-[9px] font-bold text-gray-700 drop-shadow-sm">
                      {plan.installments_paid}/{plan.installments}
                    </span>
                    <span className="text-[9px] font-medium text-gray-500">
                      ${plan.installment_amount}/mo · {(plan.apr * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-16 flex-shrink-0">
                  <span className="text-[10px] font-medium text-gray-400">
                    {remaining} left
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {plans.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No active payment plans</p>
        )}
      </div>

      {/* Cheerful footer */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">
          {active_count === 0
            ? "No active plans. You're all caught up!"
            : active_count <= 2
            ? "You're making great progress! Keep it up."
            : active_count <= 4
            ? "You're managing multiple plans like a pro! Stay on track."
            : "You're a dedicated Landly resident! Every payment counts."}
        </p>
        <div className="flex items-center gap-3">
          {Object.entries(PLAN_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[9px] text-gray-400 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
