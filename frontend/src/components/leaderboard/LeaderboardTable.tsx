"use client";

import Link from "next/link";

export interface LeaderboardEntry {
  citizen_id: string;
  name: string;
  missed_payments: number;
  social_credit_score: number;
  eviction_odds: number;
  total_owed: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

function getRiskTint(odds: number): string {
  if (odds > 50) return "bg-red-50";
  if (odds >= 20) return "bg-amber-50";
  return "bg-green-50";
}

function getCreditColor(score: number): string {
  if (score < 400) return "text-red-500";
  if (score <= 700) return "text-amber-500";
  return "text-green-600";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Resident ID
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Missed Payments
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Community Score
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Risk Score
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Total Owed
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;
              const isFirst = rank === 1;
              const riskTint = getRiskTint(entry.eviction_odds);
              const rowBg = isTopThree ? "bg-red-50" : riskTint;
              const stripe = !isTopThree && index % 2 === 1 ? "bg-gray-50/50" : "";

              return (
                <tr
                  key={entry.citizen_id}
                  className={`${rowBg} ${stripe} transition-colors hover:bg-gray-100`}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isFirst && (
                        <span className="text-lg text-red-500" title="Highest risk">
                          {"\u26A0"}
                        </span>
                      )}
                      <span
                        className={`font-mono ${
                          isFirst
                            ? "text-xl font-black text-red-500"
                            : isTopThree
                              ? "text-base font-bold text-red-400"
                              : "text-sm font-medium text-gray-500"
                        }`}
                      >
                        #{rank}
                      </span>
                    </div>
                  </td>

                  {/* Resident ID */}
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono ${
                        isTopThree ? "font-bold text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {entry.citizen_id}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <span
                      className={`${
                        isFirst
                          ? "text-base font-black text-gray-900"
                          : isTopThree
                            ? "font-bold text-gray-900"
                            : "text-gray-500"
                      }`}
                    >
                      {entry.name}
                    </span>
                  </td>

                  {/* Missed Payments */}
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono ${
                        isTopThree ? "font-bold text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {entry.missed_payments}
                    </span>
                  </td>

                  {/* Community Score */}
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono font-semibold ${getCreditColor(
                        entry.social_credit_score
                      )}`}
                    >
                      {entry.social_credit_score}
                    </span>
                  </td>

                  {/* Risk Score */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                            entry.eviction_odds > 50
                              ? "bg-red-400"
                              : entry.eviction_odds >= 20
                                ? "bg-amber-400"
                                : "bg-green-400"
                          }`}
                          style={{ width: `${Math.min(entry.eviction_odds, 100)}%` }}
                        />
                      </div>
                      <span
                        className={`font-mono font-semibold ${
                          isTopThree ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {entry.eviction_odds.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Total Owed */}
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono ${
                        isTopThree ? "font-bold text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {formatCurrency(entry.total_owed)}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <Link
                      href="/markets"
                      className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 transition-all hover:border-blue-300 hover:bg-blue-100"
                    >
                      View Market
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 leading-relaxed">
          Risk scores are calculated based on payment history, Community Score, and outstanding balance.
        </p>

        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <span className="text-xs text-gray-500">
            <span className="font-mono font-semibold text-gray-900">
              {entries.length}
            </span>{" "}
            residents tracked
          </span>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Updated in real-time
          </div>
        </div>
      </div>
    </div>
  );
}
