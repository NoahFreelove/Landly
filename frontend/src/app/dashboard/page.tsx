"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getDashboard, getNotifications } from "@/lib/api";
import type { DashboardData, ResourceMetric } from "@/lib/types";
import AppLayout from "@/components/layout/AppLayout";
import ScoreCard from "@/components/dashboard/ScoreCard";
import PaymentTable from "@/components/dashboard/PaymentTable";
import NotificationFeed from "@/components/dashboard/NotificationFeed";
import AdBanner from "@/components/dashboard/AdBanner";
import GentrificationBar from "@/components/dashboard/GentrificationBar";
import EvictionWidget from "@/components/dashboard/EvictionWidget";

// Skeleton components for loading state
function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-surface-card border border-[#2b2839] rounded-lg p-5 animate-pulse ${className}`}
    >
      <div className="h-3 w-24 bg-white/5 rounded mb-4" />
      <div className="h-8 w-20 bg-white/5 rounded mb-3" />
      <div className="h-2 w-full bg-white/5 rounded" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-surface-card border border-[#2b2839] rounded-lg animate-pulse">
      <div className="px-5 py-4 border-b border-[#2b2839]">
        <div className="h-3 w-32 bg-white/5 rounded" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="px-5 py-3 flex gap-4 border-b border-[#2b2839]/50"
        >
          <div className="h-3 w-16 bg-white/5 rounded" />
          <div className="h-3 w-12 bg-white/5 rounded" />
          <div className="h-3 w-14 bg-white/5 rounded" />
          <div className="h-3 w-10 bg-white/5 rounded flex-1" />
        </div>
      ))}
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-surface-card border border-[#2b2839] rounded-lg p-5 animate-pulse ${className}`}
    >
      <div className="h-3 w-40 bg-white/5 rounded mb-4" />
      <div className="h-16 w-full bg-white/5 rounded" />
    </div>
  );
}

// Resource bar helper for unit info
function ResourceBar({ resource }: { resource: ResourceMetric }) {
  const percentage = (resource.current_value / resource.max_value) * 100;
  const statusColors: Record<string, string> = {
    normal: "bg-green-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
  };
  const trendIcons: Record<string, string> = {
    up: "\u2191",
    down: "\u2193",
    stable: "\u2192",
  };
  const trendColors: Record<string, string> = {
    up: "text-green-400",
    down: "text-red-400",
    stable: "text-zinc-500",
  };

  const labels: Record<string, string> = {
    oxygen: "O2 Quality",
    water: "Water Ration",
    power: "Power Usage",
    noise: "Noise Level",
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {labels[resource.metric_type] || resource.metric_type}
        </span>
        <div className="flex items-center gap-1">
          <span
            className={`text-[10px] font-mono ${trendColors[resource.trend]}`}
          >
            {trendIcons[resource.trend]}
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            {resource.current_value}/{resource.max_value}
          </span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${statusColors[resource.status]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function fetchData() {
      try {
        const [dashboard, notifs] = await Promise.all([
          getDashboard(token!),
          getNotifications(token!).catch(() => []),
        ]);
        setDashData(dashboard);
        setNotifications(notifs);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  // Derive some display values
  const creditScore = user?.trust_score
    ? Math.round(300 + (user.trust_score / 100) * 550)
    : 580;
  const socialCredit = dashData?.user?.social_credit_score ?? user?.social_credit_score ?? 500;
  const interestRate = dashData?.recent_payments?.[0]?.interest_rate ?? 24.9;

  // Generate mock eviction leaderboard from available data
  const evictionLeaderboard = dashData
    ? [
        {
          citizen_id: dashData.user.citizen_id,
          odds: dashData.eviction_status.is_pending ? 89 : 23,
        },
        { citizen_id: "CZ-991-A", odds: 72 },
        { citizen_id: "CZ-445-D", odds: 58 },
        { citizen_id: "CZ-113-B", odds: 34 },
        { citizen_id: "CZ-667-F", odds: 12 },
      ]
    : [];

  // Mock gentrification index
  const gentrificationIndex = 67;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              Resident Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-1">
              {user && (
                <span className="label-tracked text-zinc-500">
                  {user.citizen_id}
                </span>
              )}
              {user && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    user.status === "compliant"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : user.status === "warning"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : user.status === "probation"
                      ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user.status === "compliant"
                        ? "bg-green-400"
                        : user.status === "warning"
                        ? "bg-amber-400 animate-pulse"
                        : "bg-red-400 animate-pulse"
                    }`}
                  />
                  {user.status.replace("_", " ")}
                </span>
              )}
            </div>
          </div>
          {user && (
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded border ${
                user.tier === "platinum"
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  : user.tier === "gold"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : user.tier === "silver"
                  ? "bg-zinc-400/10 text-zinc-300 border-zinc-400/20"
                  : "bg-orange-800/10 text-orange-400 border-orange-800/20"
              }`}
            >
              {user.tier} Tier
            </span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <p className="text-sm text-red-300 font-medium">
                System Error
              </p>
              <p className="text-xs text-red-400/70">{error}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonBlock />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonTable />
              <SkeletonBlock className="h-64" />
            </div>
            <SkeletonBlock />
            <SkeletonBlock />
            <SkeletonBlock />
          </>
        )}

        {/* Loaded state */}
        {!loading && dashData && (
          <>
            {/* Score Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard
                title="Credit Score"
                value={creditScore}
                max={850}
                color={creditScore >= 670 ? "green" : creditScore >= 500 ? "yellow" : "red"}
                subtitle="Based on payment history & compliance"
              />
              <ScoreCard
                title="Social Credit"
                value={socialCredit}
                max={1000}
                color="dynamic"
                subtitle="Monitored by OmniCorp Behavioral Division"
              />
              <ScoreCard
                title="Interest Rate"
                value={interestRate}
                max={100}
                color={interestRate <= 10 ? "green" : interestRate <= 25 ? "yellow" : "red"}
                subtitle="Current rate on outstanding obligations"
                isPercentage
              />
            </div>

            {/* Unit Info Card */}
            {dashData.unit && (
              <div className="bg-surface-card border border-[#2b2839] rounded-lg p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="label-tracked mb-2">Assigned Dwelling</h3>
                    <h2 className="text-lg font-bold text-zinc-100">
                      {dashData.unit.name}
                    </h2>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-zinc-500">
                        Sector{" "}
                        <span className="text-zinc-300 font-medium">
                          {dashData.unit.sector}
                        </span>
                      </span>
                      <span className="text-white/10">|</span>
                      <span className="text-xs text-zinc-500">
                        Level{" "}
                        <span className="text-zinc-300 font-medium">
                          {dashData.unit.level}
                        </span>
                      </span>
                      <span className="text-white/10">|</span>
                      <span className="text-xs text-zinc-500">
                        Smart Lock:{" "}
                        <span
                          className={`font-medium ${
                            dashData.unit.smart_lock_status === "locked"
                              ? "text-red-400"
                              : dashData.unit.smart_lock_status === "override"
                              ? "text-amber-400"
                              : "text-green-400"
                          }`}
                        >
                          {dashData.unit.smart_lock_status.toUpperCase()}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-500">Monthly Rent</span>
                    <p className="text-xl font-bold text-zinc-100">
                      ${dashData.unit.monthly_rent_usd.toLocaleString()}
                      <span className="text-xs font-normal text-zinc-500">
                        /mo
                      </span>
                    </p>
                  </div>
                </div>

                {/* Resource bars */}
                {dashData.resources.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#2b2839]">
                    {dashData.resources.map((r) => (
                      <ResourceBar key={r.id} resource={r} />
                    ))}
                  </div>
                )}

                {/* Radiation & altitude quick stats */}
                <div className="flex items-center gap-6 mt-4 pt-3 border-t border-[#2b2839]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500/50" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      Radiation
                    </span>
                    <span className="text-xs font-mono text-amber-400">
                      {dashData.unit.radiation_level} mSv
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500/50" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      Altitude
                    </span>
                    <span className="text-xs font-mono text-blue-400">
                      {dashData.unit.altitude}m
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500/50" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      O2 Quality
                    </span>
                    <span className="text-xs font-mono text-cyan-400">
                      {dashData.unit.oxygen_quality}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Table + Notification Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <PaymentTable
                  payments={dashData.recent_payments}
                  klarnaDebts={dashData.klarna_debts}
                />
              </div>
              <div className="lg:col-span-2">
                <NotificationFeed notifications={notifications} />
              </div>
            </div>

            {/* Ad Banner */}
            <AdBanner />

            {/* Gentrification Bar */}
            <GentrificationBar index={gentrificationIndex} />

            {/* Eviction Widget */}
            <EvictionWidget leaderboard={evictionLeaderboard} />

            {/* Eviction warning if pending */}
            {dashData.eviction_status.is_pending && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-300 uppercase tracking-wider">
                    Eviction Proceedings Active
                  </h4>
                  <p className="text-xs text-red-400/70 mt-1">
                    {dashData.eviction_status.reason ||
                      "Multiple compliance violations detected."}
                    {dashData.eviction_status.deadline && (
                      <span className="block mt-1 font-mono">
                        Deadline:{" "}
                        {new Date(
                          dashData.eviction_status.deadline
                        ).toLocaleDateString()}
                      </span>
                    )}
                    {dashData.eviction_status.amount_owed > 0 && (
                      <span className="block mt-1 font-mono">
                        Amount Owed: $
                        {dashData.eviction_status.amount_owed.toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
