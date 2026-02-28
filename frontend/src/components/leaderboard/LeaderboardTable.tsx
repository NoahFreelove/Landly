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
  if (odds > 50) return "bg-red-500/10";
  if (odds >= 20) return "bg-yellow-500/8";
  return "bg-accent-green/5";
}

function getCreditColor(score: number): string {
  if (score < 400) return "text-accent-red";
  if (score <= 700) return "text-accent-yellow";
  return "text-accent-green";
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
      <div className="overflow-x-auto rounded-xl border border-[#2b2839]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-elevated">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                Citizen ID
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                Name
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                Missed Payments
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                Social Credit
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                Eviction Odds
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                Total Owed
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2b2839]/50">
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;
              const isFirst = rank === 1;
              const riskTint = getRiskTint(entry.eviction_odds);
              const rowBg = isTopThree ? "bg-red-500/10" : riskTint;
              const stripe = !isTopThree && index % 2 === 1 ? "bg-white/[0.02]" : "";

              return (
                <tr
                  key={entry.citizen_id}
                  className={`${rowBg} ${stripe} transition-colors hover:bg-white/[0.06]`}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isFirst && (
                        <span className="text-lg text-accent-red" title="Highest eviction risk">
                          {"\u26A0"}
                        </span>
                      )}
                      <span
                        className={`font-mono ${
                          isFirst
                            ? "text-xl font-black text-accent-red"
                            : isTopThree
                              ? "text-base font-bold text-red-400"
                              : "text-sm font-medium text-zinc-400"
                        }`}
                      >
                        #{rank}
                      </span>
                    </div>
                  </td>

                  {/* Citizen ID */}
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono ${
                        isTopThree ? "font-bold text-white" : "text-zinc-300"
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
                          ? "text-base font-black text-white"
                          : isTopThree
                            ? "font-bold text-white"
                            : "text-zinc-300"
                      }`}
                    >
                      {entry.name}
                    </span>
                  </td>

                  {/* Missed Payments */}
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono ${
                        isTopThree ? "font-bold text-white" : "text-zinc-300"
                      }`}
                    >
                      {entry.missed_payments}
                    </span>
                  </td>

                  {/* Social Credit Score */}
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono font-semibold ${getCreditColor(
                        entry.social_credit_score
                      )}`}
                    >
                      {entry.social_credit_score}
                    </span>
                  </td>

                  {/* Eviction Odds */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-2 w-20 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                            entry.eviction_odds > 50
                              ? "bg-accent-red"
                              : entry.eviction_odds >= 20
                                ? "bg-accent-yellow"
                                : "bg-accent-green"
                          }`}
                          style={{ width: `${Math.min(entry.eviction_odds, 100)}%` }}
                        />
                      </div>
                      <span
                        className={`font-mono font-semibold ${
                          isTopThree ? "text-white" : "text-zinc-300"
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
                        isTopThree ? "font-bold text-white" : "text-zinc-300"
                      }`}
                    >
                      {formatCurrency(entry.total_owed)}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <Link
                      href="/markets"
                      className="inline-flex items-center gap-1 rounded-md border border-accent-red/30 bg-accent-red/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-red transition-all hover:border-accent-red/60 hover:bg-accent-red/20"
                    >
                      BET NOW
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="rounded-xl border border-[#2b2839] bg-surface-card p-6 space-y-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600 leading-relaxed">
          DISCLAIMER: Eviction odds are calculated by the Landly Predictive
          Compliance Engine. Accuracy is not guaranteed. Betting on human
          suffering is encouraged by building management.
        </p>

        <div className="flex items-center justify-between border-t border-[#2b2839] pt-4">
          <span className="text-xs text-zinc-500">
            <span className="font-mono font-semibold text-zinc-300">
              {entries.length}
            </span>{" "}
            tenants tracked
          </span>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
            </span>
            Updated in real-time
          </div>
        </div>
      </div>
    </div>
  );
}
