"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { getDashboard, getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import RatingModal from "@/components/dashboard/RatingModal";
import type { DashboardData } from "@/lib/types";
import { TIER_LABELS } from "@/lib/types";
import AppLayout from "@/components/layout/AppLayout";
import ScoreCard from "@/components/dashboard/ScoreCard";
import PaymentTable from "@/components/dashboard/PaymentTable";
import NotificationFeed from "@/components/dashboard/NotificationFeed";
import AdBanner from "@/components/dashboard/AdBanner";
import GentrificationBar from "@/components/dashboard/GentrificationBar";
import EvictionWidget from "@/components/dashboard/EvictionWidget";
import TotalDebtCard from "@/components/dashboard/TotalDebtCard";
import PaymentModal from "@/components/dashboard/PaymentModal";

// Skeleton components for loading state
function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 animate-pulse ${className}`}
    >
      <div className="h-3 w-24 bg-gray-100 rounded mb-4" />
      <div className="h-8 w-20 bg-gray-100 rounded mb-3" />
      <div className="h-2 w-full bg-gray-100 rounded" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl animate-pulse">
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="h-3 w-32 bg-gray-100 rounded" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="px-5 py-3 flex gap-4 border-b border-gray-100"
        >
          <div className="h-3 w-16 bg-gray-100 rounded" />
          <div className="h-3 w-12 bg-gray-100 rounded" />
          <div className="h-3 w-14 bg-gray-100 rounded" />
          <div className="h-3 w-10 bg-gray-100 rounded flex-1" />
        </div>
      ))}
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 animate-pulse ${className}`}
    >
      <div className="h-3 w-40 bg-gray-100 rounded mb-4" />
      <div className="h-16 w-full bg-gray-100 rounded" />
    </div>
  );
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const refreshDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const [dashboard, notifs] = await Promise.all([
        getDashboard(token),
        getNotifications(token).catch(() => []),
      ]);
      setDashData(dashboard);
      setNotifications(notifs);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refreshDashboard();
  }, [token, refreshDashboard]);

  async function handleDismissNotification(id: number) {
    if (!token) return;
    await markNotificationRead(token, id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function handleClearAllNotifications() {
    if (!token) return;
    await markAllNotificationsRead(token);
    setNotifications([]);
  }

  // Derive some display values
  const creditScore = dashData?.credit_score
    ?? (user?.trust_score ? Math.round(300 + (user.trust_score / 100) * 550) : 580);
  const communityScore = dashData?.user?.social_credit_score ?? user?.social_credit_score ?? 500;
  const interestRate = dashData?.interest_rate ?? dashData?.recent_payments?.[0]?.interest_rate ?? 24.9;

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

  // Gentrification index
  const gentrificationIndex = dashData?.gentrification_index ?? 67;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Resident Dashboard
              </h1>
              <img
                src="/illustrations/standing-5.svg"
                alt=""
                className="w-32 opacity-30"
              />
            </div>
            <div className="flex items-center gap-3 mt-1">
              {user && (
                <span className="text-xs font-medium tracking-wider uppercase text-gray-500">
                  Resident ID: {user.citizen_id}
                </span>
              )}
              {user && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    user.status === "compliant"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : user.status === "warning"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : user.status === "probation"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user.status === "compliant"
                        ? "bg-green-500"
                        : user.status === "warning"
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-red-500 animate-pulse"
                    }`}
                  />
                  {user.status.replace("_", " ")}
                </span>
              )}
            </div>
          </div>
          {user && (
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                user.tier === "platinum"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : user.tier === "gold"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : user.tier === "silver"
                  ? "bg-gray-50 text-gray-700 border-gray-200"
                  : "bg-orange-50 text-orange-700 border-orange-200"
              }`}
            >
              {TIER_LABELS[user.tier] || user.tier} Tier
            </span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0"
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
              <p className="text-sm text-red-700 font-medium">
                System Error
              </p>
              <p className="text-xs text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <>
            {/* Total Debt skeleton */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-32 bg-gray-100 rounded mb-4" />
                  <div className="h-12 w-48 bg-gray-100 rounded mb-3" />
                  <div className="h-2 w-64 bg-gray-100 rounded" />
                </div>
                <div className="h-12 w-36 bg-gray-100 rounded-lg" />
              </div>
            </div>
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
            {/* Total Debt Card */}
            <TotalDebtCard
              totalDebt={dashData.total_debt}
              breakdown={dashData.debt_breakdown}
              onMakePayment={() => setPaymentOpen(true)}
            />

            {/* Score Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard
                title="Credit Score"
                value={creditScore}
                max={850}
                color={creditScore >= 670 ? "green" : creditScore >= 500 ? "yellow" : "red"}
                subtitle="Based on payment history"
              />
              <ScoreCard
                title="Community Score"
                value={communityScore}
                max={1000}
                color="dynamic"
                subtitle="Based on community engagement"
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
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Your Unit</h3>
                    <h2 className="text-lg font-bold text-gray-900">
                      {dashData.unit.name}
                    </h2>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        Sector{" "}
                        <span className="text-gray-900 font-medium">
                          {dashData.unit.sector}
                        </span>
                      </span>
                      <span className="text-gray-200">|</span>
                      <span className="text-xs text-gray-500">
                        Floor{" "}
                        <span className="text-gray-900 font-medium">
                          {dashData.unit.floor}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Monthly Rent</span>
                    <p className="text-xl font-bold text-gray-900">
                      ${dashData.unit.monthly_rent_usd.toLocaleString()}
                      <span className="text-xs font-normal text-gray-500">
                        /mo
                      </span>
                    </p>
                  </div>
                </div>

                {/* Unit details grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Sq Ft</span>
                    <span className="text-sm font-semibold text-gray-900 mt-0.5">{dashData.unit.sqft.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Bedrooms</span>
                    <span className="text-sm font-semibold text-gray-900 mt-0.5">{dashData.unit.bedrooms}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Bathrooms</span>
                    <span className="text-sm font-semibold text-gray-900 mt-0.5">{dashData.unit.bathrooms}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Year Built</span>
                    <span className="text-sm font-semibold text-gray-900 mt-0.5">{dashData.unit.year_built}</span>
                  </div>
                </div>

                {/* Second row of details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Pet Policy</span>
                    <span className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">{dashData.unit.pet_policy}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Parking</span>
                    <span className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">{dashData.unit.parking}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Laundry</span>
                    <span className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">{dashData.unit.laundry}</span>
                  </div>
                </div>

                {/* Feature badges */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  {dashData.unit.smart_home && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Smart Home Enabled
                    </span>
                  )}
                  {dashData.unit.noise_monitoring && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium border border-purple-100">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 12h.01M18.364 5.636a9 9 0 010 12.728" />
                      </svg>
                      Noise Monitoring
                    </span>
                  )}
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
                <NotificationFeed
                  notifications={notifications}
                  onDismiss={handleDismissNotification}
                  onClearAll={handleClearAllNotifications}
                />
              </div>
            </div>

            {/* Rate Your Neighbor */}
            <button
              onClick={() => setRatingOpen(true)}
              className="group bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer text-left w-full"
            >
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                <svg
                  className="w-5 h-5 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 group-hover:text-blue-700 transition-colors">
                  Rate Your Neighbor
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Submit a community review to help build a better neighborhood
                </p>
              </div>
              <svg
                className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Ad Banner */}
            <AdBanner />

            {/* Gentrification Bar */}
            <GentrificationBar index={gentrificationIndex} />

            {/* Eviction Widget */}
            <EvictionWidget leaderboard={evictionLeaderboard} />

            {/* Eviction warning if pending */}
            {dashData.eviction_status.is_pending && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-600"
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
                  <h4 className="text-sm font-bold text-red-700 uppercase tracking-wider">
                    Lease Risk Alert
                  </h4>
                  <p className="text-xs text-red-600 mt-1">
                    {dashData.eviction_status.reason ||
                      "Multiple compliance issues detected. Please contact management."}
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

      {/* Rating Modal */}
      <RatingModal isOpen={ratingOpen} onClose={() => setRatingOpen(false)} />

      {/* Payment Modal */}
      {dashData && (
        <PaymentModal
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          payments={dashData.recent_payments}
          klarnaDebts={dashData.klarna_debts}
          totalDebt={dashData.total_debt}
          onPaymentMade={refreshDashboard}
        />
      )}
    </AppLayout>
  );
}
