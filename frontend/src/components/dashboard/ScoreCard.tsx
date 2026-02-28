"use client";

interface ScoreCardProps {
  title: string;
  value: number;
  max: number;
  color?: "green" | "yellow" | "red" | "dynamic";
  subtitle?: string;
  isPercentage?: boolean;
}

function getBarColor(color: string, value: number, max: number): string {
  if (color === "dynamic") {
    const ratio = value / max;
    if (ratio < 0.4) return "bg-red-500";
    if (ratio < 0.7) return "bg-amber-500";
    return "bg-green-500";
  }
  if (color === "green") return "bg-green-500";
  if (color === "yellow") return "bg-amber-500";
  return "bg-red-500";
}

export default function ScoreCard({
  title,
  value,
  max,
  color = "dynamic",
  subtitle,
  isPercentage = false,
}: ScoreCardProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const barColor = getBarColor(color, value, max);

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-300 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{title}</span>
        <span className="text-[10px] font-mono text-gray-500">
          {isPercentage ? `${value.toFixed(1)}%` : `${value} / ${max}`}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-bold tabular-nums text-gray-900`}>
          {isPercentage ? value.toFixed(1) : value}
        </span>
        {isPercentage ? (
          <span className="text-lg text-gray-500">%</span>
        ) : (
          <span className="text-sm text-gray-500">/ {max}</span>
        )}
      </div>

      {/* Gauge bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Tick marks */}
      <div className="relative w-full h-1">
        <div className="absolute left-0 w-px h-1 bg-gray-200" />
        <div className="absolute left-1/4 w-px h-1 bg-gray-200" />
        <div className="absolute left-1/2 w-px h-1 bg-gray-200" />
        <div className="absolute left-3/4 w-px h-1 bg-gray-200" />
        <div className="absolute right-0 w-px h-1 bg-gray-200" />
      </div>

      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
