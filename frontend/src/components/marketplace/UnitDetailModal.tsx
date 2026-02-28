"use client";

import type { Unit } from "@/lib/types";

interface UnitDetailModalProps {
  unit: Unit | null;
  isOpen: boolean;
  onClose: () => void;
  onRent: (unit: Unit) => void;
}

function radiationLabel(level: number) {
  if (level >= 7) return { text: "CRITICAL", color: "text-accent-red" };
  if (level >= 4) return { text: "ELEVATED", color: "text-accent-yellow" };
  return { text: "NOMINAL", color: "text-accent-green" };
}

function lockLabel(status: Unit["smart_lock_status"]) {
  const map: Record<string, { text: string; color: string }> = {
    locked: { text: "LOCKED", color: "text-accent-green" },
    unlocked: { text: "UNLOCKED", color: "text-accent-yellow" },
    override: { text: "OVERRIDE", color: "text-accent-red" },
  };
  return map[status] || map.locked;
}

export default function UnitDetailModal({
  unit,
  isOpen,
  onClose,
  onRent,
}: UnitDetailModalProps) {
  if (!isOpen || !unit) return null;

  const rad = radiationLabel(unit.radiation_level);
  const lock = lockLabel(unit.smart_lock_status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-surface-card ring-1 ring-border shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-zinc-400 ring-1 ring-border transition-colors hover:text-white"
        >
          X
        </button>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary-dark via-primary to-primary-light p-8 pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">
            Unit Dossier
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">
            {unit.name}
          </h2>
          <p className="mt-1 text-sm text-white/70">
            {unit.sector} &bull; Level {unit.level} &bull; Altitude{" "}
            {unit.altitude}m
          </p>

          {/* Availability */}
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                unit.is_available ? "bg-accent-green" : "bg-accent-red"
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              {unit.is_available
                ? "Available for Assignment"
                : "Currently Occupied"}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          <StatCell label="Monthly Rent" value={`$${unit.monthly_rent_usd.toLocaleString()}`} sub="/mo" />
          <StatCell label="Weekly Credits" value={`${unit.weekly_rent_credits}`} sub="CR" />
          <StatCell
            label="Radiation"
            value={unit.radiation_level.toFixed(1)}
            sub={rad.text}
            valueColor={rad.color}
          />
          <StatCell
            label="Oxygen Quality"
            value={`${unit.oxygen_quality}%`}
            sub={unit.oxygen_quality >= 80 ? "BREATHABLE" : "FILTERED"}
            valueColor={unit.oxygen_quality >= 80 ? "text-accent-green" : "text-accent-yellow"}
          />
          <StatCell label="Sector" value={unit.sector} />
          <StatCell label="Level" value={`${unit.level}`} />
          <StatCell label="Altitude" value={`${unit.altitude}m`} />
          <StatCell
            label="Smart Lock"
            value={lock.text}
            valueColor={lock.color}
          />
        </div>

        {/* Action area */}
        <div className="flex flex-col gap-3 p-6">
          <p className="text-center text-xs text-zinc-500">
            All units are subject to mandatory inspections. Rent is
            non-negotiable and automatically deducted from your citizen account.
            Failure to comply will result in social credit deductions and
            potential reassignment.
          </p>
          <button
            onClick={() => onRent(unit)}
            disabled={!unit.is_available}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-accent-klarna/30 bg-accent-klarna/10 text-base font-bold uppercase tracking-wide text-accent-klarna transition-all hover:bg-accent-klarna/20 hover:shadow-lg hover:shadow-accent-klarna/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            RENT WITH KLARNA
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  sub,
  valueColor = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-surface-card p-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      <span className={`text-lg font-bold ${valueColor}`}>
        {value}
        {sub && (
          <span className="ml-1 text-xs font-normal text-zinc-500">{sub}</span>
        )}
      </span>
    </div>
  );
}
