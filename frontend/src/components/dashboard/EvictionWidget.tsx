"use client";

interface EvictionEntry {
  citizen_id: string;
  odds: number;
}

interface EvictionWidgetProps {
  leaderboard: EvictionEntry[];
}

export default function EvictionWidget({ leaderboard }: EvictionWidgetProps) {
  // Sort by odds descending, take top 5
  const entries = [...leaderboard]
    .sort((a, b) => b.odds - a.odds)
    .slice(0, 5);
  const maxOdds = entries.length > 0 ? entries[0].odds : 0;

  return (
    <div className="bg-surface-card border border-[#2b2839] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2b2839] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="label-tracked">
            <span className="text-red-400">Eviction</span>{" "}
            <span className="text-zinc-400">Watch</span>
          </h3>
        </div>
        <span className="text-[9px] font-mono text-zinc-600 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
          LIVE ODDS
        </span>
      </div>

      {/* Entries */}
      <div className="divide-y divide-[#2b2839]/50">
        {entries.map((entry, i) => {
          const isHighest = entry.odds === maxOdds && entry.odds > 0;
          const barWidth = maxOdds > 0 ? (entry.odds / 100) * 100 : 0;
          return (
            <div
              key={entry.citizen_id}
              className={`px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors relative ${
                isHighest ? "bg-red-500/[0.03]" : ""
              }`}
            >
              {/* Background bar */}
              <div
                className={`absolute inset-y-0 left-0 ${
                  isHighest ? "bg-red-500/[0.06]" : "bg-white/[0.01]"
                } transition-all duration-700`}
                style={{ width: `${barWidth}%` }}
              />

              {/* Rank */}
              <span
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isHighest
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-white/5 text-zinc-500 border border-[#2b2839]"
                }`}
              >
                {i + 1}
              </span>

              {/* Citizen ID */}
              <span
                className={`relative z-10 text-xs font-mono flex-1 ${
                  isHighest ? "text-red-300 font-bold" : "text-zinc-300"
                }`}
              >
                {entry.citizen_id}
              </span>

              {/* Odds */}
              <span
                className={`relative z-10 text-sm font-bold tabular-nums ${
                  isHighest
                    ? "text-red-400"
                    : entry.odds > 50
                    ? "text-amber-400"
                    : "text-zinc-400"
                }`}
              >
                {entry.odds}%
              </span>

              {/* Bet link */}
              <span
                className={`relative z-10 text-[9px] font-bold uppercase tracking-wider cursor-pointer hover:underline ${
                  isHighest
                    ? "text-red-500 hover:text-red-400"
                    : "text-primary-light hover:text-primary"
                }`}
              >
                Bet Now
              </span>
            </div>
          );
        })}
        {entries.length === 0 && (
          <div className="px-5 py-8 text-center text-zinc-600 text-xs">
            No eviction data available.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-[#2b2839] bg-white/[0.01]">
        <p className="text-[9px] text-zinc-600 italic">
          * Odds calculated by OmniCorp Actuarial Division. Not financial advice.
          Betting on neighbor eviction is tax-deductible for Platinum tier.
        </p>
      </div>
    </div>
  );
}
