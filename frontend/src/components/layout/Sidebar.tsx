"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { TIER_LABELS } from "@/lib/types";
import { Button, KIND, SIZE } from "baseui/button";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "\u25A3" },
  { label: "Marketplace", href: "/marketplace", icon: "\u2302" },
  { label: "Landly Assistant", href: "/landlord", icon: "\u2318" },
  { label: "Markets", href: "/markets", icon: "\u2616" },
  { label: "Lease Risk", href: "/leaderboard", icon: "\u2605" },
];

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-700",
  silver: "bg-gray-100 text-gray-600",
  gold: "bg-yellow-100 text-yellow-700",
  platinum: "bg-purple-100 text-purple-700",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-[250px] flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-blue-500">LAND</span>
          <span className="text-gray-900">LY</span>
        </h1>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-200" />

      {/* User section */}
      {user && (
        <div className="px-5 py-4 space-y-2">
          <p className="label-tracked text-[10px] text-gray-500">
            Resident Profile
          </p>
          <p className="text-sm font-semibold text-gray-900 tracking-wide">
            {user.citizen_id}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_COLORS[user.tier] || "bg-gray-100 text-gray-500"}`}
            >
              {TIER_LABELS[user.tier] || user.tier}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Community Score:&nbsp;
            <span className="font-semibold text-gray-900">
              {user.social_credit_score}
            </span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 border-t border-gray-200" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="label-tracked mb-3 px-3 text-[10px] text-gray-400">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-50 text-blue-600 border-l-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Humaaan illustration */}
      <img src="/illustrations/sitting-3.svg" alt="" className="w-20 opacity-40 mx-auto mt-auto mb-4" />

      {/* Bottom: Logout */}
      <div className="border-t border-gray-200 px-3 py-4">
        <Button
          onClick={logout}
          kind={KIND.secondary}
          size={SIZE.compact}
          startEnhancer={() => <span className="text-base leading-none">{"\u2190"}</span>}
          overrides={{
            BaseButton: {
              style: {
                width: '100%',
                justifyContent: 'flex-start',
                backgroundColor: 'transparent',
                color: '#9ca3af',
                fontSize: '0.875rem',
                fontWeight: 500,
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem',
                paddingTop: '0.625rem',
                paddingBottom: '0.625rem',
                borderTopLeftRadius: '0.5rem',
                borderTopRightRadius: '0.5rem',
                borderBottomLeftRadius: '0.5rem',
                borderBottomRightRadius: '0.5rem',
                borderTopWidth: '0',
                borderRightWidth: '0',
                borderBottomWidth: '0',
                borderLeftWidth: '0',
                ':hover': {
                  backgroundColor: '#fef2f2',
                  color: '#ef4444',
                },
              },
            },
          }}
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
