"use client";

import { useEffect, useState } from "react";

interface GentrificationBarProps {
  index: number;
}

function getLabel(index: number): string {
  if (index < 25) return "Stable";
  if (index < 50) return "Transitioning";
  if (index < 75) return "Accelerating";
  return "Critical Displacement";
}

function getLabelColor(index: number): string {
  if (index < 25) return "text-green-400";
  if (index < 50) return "text-amber-400";
  if (index < 75) return "text-orange-400";
  return "text-red-400";
}

export default function GentrificationBar({ index }: GentrificationBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    // Trigger animation after mount
    const timeout = setTimeout(() => {
      setAnimatedWidth(Math.min(index, 100));
    }, 100);
    return () => clearTimeout(timeout);
  }, [index]);

  return (
    <div className="bg-surface-card border border-[#2b2839] rounded-lg p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="label-tracked">Gentrification Index</h3>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${getLabelColor(
              index
            )}`}
          >
            {getLabel(index)}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-2xl font-bold tabular-nums ${getLabelColor(
              index
            )}`}
          >
            {index}
          </span>
          <span className="text-xs text-zinc-500">/ 100</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1500 ease-out relative"
          style={{
            width: `${animatedWidth}%`,
            background:
              "linear-gradient(90deg, #22c55e 0%, #eab308 40%, #f97316 70%, #ef4444 100%)",
            transitionDuration: "1.5s",
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
              animation: "shimmer 2s infinite",
            }}
          />
        </div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-2 text-[9px] font-mono text-zinc-600">
        <span>0 - Safe</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100 - Displaced</span>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
