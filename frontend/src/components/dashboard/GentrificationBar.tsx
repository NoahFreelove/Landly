"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "baseui/progress-bar";

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

function getBarColor(index: number): string {
  if (index < 25) return "#22c55e";
  if (index < 50) return "#eab308";
  if (index < 75) return "#f97316";
  return "#ef4444";
}

export default function GentrificationBar({ index }: GentrificationBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Trigger animation after mount
    const timeout = setTimeout(() => {
      setAnimatedValue(Math.min(index, 100));
    }, 100);
    return () => clearTimeout(timeout);
  }, [index]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
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
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        value={animatedValue}
        maxValue={100}
        minValue={0}
        showLabel={false}
        overrides={{
          Root: {
            style: {
              marginLeft: '0',
              marginRight: '0',
              marginTop: '0',
              marginBottom: '0',
            },
          },
          BarContainer: {
            style: {
              backgroundColor: '#f3f4f6',
              borderTopLeftRadius: '9999px',
              borderTopRightRadius: '9999px',
              borderBottomLeftRadius: '9999px',
              borderBottomRightRadius: '9999px',
              overflow: 'hidden',
              height: '0.75rem',
              marginLeft: '0',
              marginRight: '0',
            },
          },
          Bar: {
            style: {
              borderTopLeftRadius: '9999px',
              borderTopRightRadius: '9999px',
              borderBottomLeftRadius: '9999px',
              borderBottomRightRadius: '9999px',
            },
          },
          BarProgress: {
            style: {
              backgroundColor: getBarColor(index),
              borderTopLeftRadius: '9999px',
              borderTopRightRadius: '9999px',
              borderBottomLeftRadius: '9999px',
              borderBottomRightRadius: '9999px',
              transitionProperty: 'width',
              transitionDuration: '1.5s',
              transitionTimingFunction: 'ease-out',
            },
          },
        }}
      />

      {/* Scale labels */}
      <div className="flex justify-between mt-2 text-[9px] font-mono text-gray-400">
        <span>0 - Safe</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100 - Displaced</span>
      </div>
    </div>
  );
}
