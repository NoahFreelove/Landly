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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-900">
            Lease Risk Monitor
          </h3>
        </div>
        <span className="text-[9px] font-mono text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
          Risk Score
        </span>
      </div>

      {/* Entries */}
      <div className="divide-y divide-gray-100">
        {entries.map((entry, i) => {
          const isHighest = entry.odds === maxOdds && entry.odds > 0;
          const barWidth = maxOdds > 0 ? (entry.odds / 100) * 100 : 0;
          return (
            <div
              key={entry.citizen_id}
              className={`px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors relative ${
                isHighest ? "bg-red-50/50" : ""
              }`}
            >
              {/* Background bar */}
              <div
                className={`absolute inset-y-0 left-0 ${
                  isHighest ? "bg-red-50" : "bg-gray-50/50"
                } transition-all duration-700`}
                style={{ width: `${barWidth}%` }}
              />

              {/* Rank */}
              <span
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isHighest
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                {i + 1}
              </span>

              {/* Resident ID */}
              <span
                className={`relative z-10 text-xs font-mono flex-1 ${
                  isHighest ? "text-red-700 font-bold" : "text-gray-700"
                }`}
              >
                {entry.citizen_id}
              </span>

              {/* Risk Score */}
              <span
                className={`relative z-10 text-sm font-bold tabular-nums ${
                  isHighest
                    ? "text-red-600"
                    : entry.odds > 50
                    ? "text-amber-600"
                    : "text-gray-500"
                }`}
              >
                {entry.odds}%
              </span>
            </div>
          );
        })}
        {entries.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-400 text-xs">
            No lease risk data available.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-gray-200 bg-gray-50">
        <p className="text-[9px] text-gray-400">
          Risk assessment based on payment history and Community Score.
        </p>
      </div>
    </div>
  );
}
