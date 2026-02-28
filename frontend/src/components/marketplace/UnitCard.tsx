"use client";

import type { Unit } from "@/lib/types";

interface UnitCardProps {
  unit: Unit;
  onClick: (unit: Unit) => void;
}

/** Deterministic gradient based on sector + level for placeholder imagery. */
function gradientForUnit(unit: Unit): string {
  const palettes: Record<string, [string, string, string]> = {
    "North Quadrant": ["#1a0a3e", "#3211d4", "#0f766e"],
    "East Industrial": ["#1c0a00", "#b45309", "#7c2d12"],
    "South Residential": ["#0a1628", "#1e40af", "#3b82f6"],
    "West Commercial": ["#1a0a2e", "#6d28d9", "#8b5cf6"],
  };
  const fallback: [string, string, string] = ["#131022", "#3211d4", "#240c9a"];
  const [a, b, c] = palettes[unit.sector] || fallback;
  const angle = ((unit.level * 37) % 360);
  return `linear-gradient(${angle}deg, ${a} 0%, ${b} 50%, ${c} 100%)`;
}

function radiationColor(level: number): string {
  if (level >= 7) return "text-accent-red";
  if (level >= 4) return "text-accent-yellow";
  return "text-accent-green";
}

function oxygenColor(quality: number): string {
  if (quality >= 80) return "text-accent-green";
  if (quality >= 50) return "text-accent-yellow";
  return "text-accent-red";
}

export default function UnitCard({ unit, onClick }: UnitCardProps) {
  return (
    <div
      onClick={() => onClick(unit)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-surface-card ring-1 ring-border transition-all duration-300 hover:ring-primary/50 hover:shadow-xl hover:shadow-primary/10"
    >
      {/* Gradient "image" header */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <div
          className="h-full w-full transition-transform duration-700 group-hover:scale-105"
          style={{ background: gradientForUnit(unit) }}
        />
        {/* Overlay gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-transparent to-transparent opacity-80" />

        {/* Availability badge */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1 backdrop-blur-md">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              unit.is_available ? "bg-accent-green" : "bg-accent-red"
            }`}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            {unit.is_available ? "Available" : "Occupied"}
          </span>
        </div>

        {/* Unit name overlay */}
        <div className="absolute bottom-4 left-4">
          <h3 className="text-xl font-bold tracking-tight text-white">
            {unit.name}
          </h3>
          <p className="text-sm text-zinc-300">
            {unit.sector} &bull; Level {unit.level}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Price + badges */}
        <div className="flex items-center justify-between border-b border-border-light pb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Monthly Rent
            </span>
            <span className="text-2xl font-bold text-white">
              ${unit.monthly_rent_usd.toLocaleString()}
              <span className="text-sm font-normal text-zinc-500">/mo</span>
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-light ring-1 ring-primary/20">
              {unit.sector}
            </span>
            <span className="rounded bg-surface-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 ring-1 ring-border">
              LVL {unit.level}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              RAD
            </span>
            <span className={`font-bold ${radiationColor(unit.radiation_level)}`}>
              {unit.radiation_level.toFixed(1)}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              O2
            </span>
            <span className={`font-bold ${oxygenColor(unit.oxygen_quality)}`}>
              {unit.oxygen_quality}%
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              CR
            </span>
            <span className="font-bold text-zinc-300">
              {unit.weekly_rent_credits}
            </span>
          </div>
        </div>

        {/* Klarna CTA */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(unit);
          }}
          className="mt-auto flex h-10 items-center justify-center gap-2 rounded-lg border border-accent-klarna/30 bg-accent-klarna/10 text-sm font-bold text-accent-klarna transition-colors hover:bg-accent-klarna/20"
        >
          RENT WITH KLARNA
        </button>
      </div>
    </div>
  );
}
