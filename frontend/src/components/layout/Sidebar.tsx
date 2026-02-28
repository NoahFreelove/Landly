"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "\u25A3" },
  { label: "Marketplace", href: "/marketplace", icon: "\u2302" },
  { label: "AI Landlord", href: "/landlord", icon: "\u2318" },
  { label: "Markets", href: "/markets", icon: "\u2616" },
  { label: "Leaderboard", href: "/leaderboard", icon: "\u2605" },
];

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-700 text-amber-100",
  silver: "bg-zinc-400 text-zinc-900",
  gold: "bg-yellow-500 text-yellow-900",
  platinum: "bg-purple-400 text-purple-950",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-[250px] flex-col border-r border-[#2b2839] bg-surface-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-primary-light">LAND</span>
          <span className="text-zinc-100">LY</span>
        </h1>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-[#2b2839]" />

      {/* User section */}
      {user && (
        <div className="px-5 py-4 space-y-2">
          <p className="label-tracked text-[10px] text-zinc-500">
            Citizen Profile
          </p>
          <p className="text-sm font-semibold text-zinc-100 tracking-wide">
            {user.citizen_id}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_COLORS[user.tier] || "bg-zinc-600 text-zinc-200"}`}
            >
              {user.tier}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
            Social Credit:&nbsp;
            <span className="font-semibold text-zinc-200">
              {user.social_credit_score}
            </span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 border-t border-[#2b2839]" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="label-tracked mb-3 px-3 text-[10px] text-zinc-500">
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
                  ? "bg-primary/15 text-primary-light shadow-[inset_0_0_0_1px_rgba(50,17,212,0.3)]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="border-t border-[#2b2839] px-3 py-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-accent-red/10 hover:text-accent-red"
        >
          <span className="text-base leading-none">{"\u2190"}</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
