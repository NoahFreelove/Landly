"use client";

import type { Unit } from "@/lib/types";
import {
  Modal,
  ModalBody,
  SIZE as MODAL_SIZE,
} from "baseui/modal";
import { Button, KIND, SIZE as BUTTON_SIZE } from "baseui/button";

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
  if (!unit) return null;

  const rad = radiationLabel(unit.radiation_level);
  const lock = lockLabel(unit.smart_lock_status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={MODAL_SIZE.default}
      overrides={{
        Root: {
          style: {
            zIndex: 50,
          },
        },
        Dialog: {
          style: {
            backgroundColor: '#1d1c27',
            borderTopColor: '#2b2839',
            borderRightColor: '#2b2839',
            borderBottomColor: '#2b2839',
            borderLeftColor: '#2b2839',
            borderTopWidth: '1px',
            borderRightWidth: '1px',
            borderBottomWidth: '1px',
            borderLeftWidth: '1px',
            borderTopStyle: 'solid',
            borderRightStyle: 'solid',
            borderBottomStyle: 'solid',
            borderLeftStyle: 'solid',
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem',
            borderBottomLeftRadius: '1rem',
            borderBottomRightRadius: '1rem',
            maxWidth: '42rem',
            width: '100%',
            overflow: 'hidden',
            padding: '0',
          },
        },
        DialogContainer: {
          style: {
            backdropFilter: 'blur(4px)',
          },
        },
        Close: {
          style: {
            color: '#a1a1aa',
            ':hover': {
              color: '#ffffff',
            },
          },
        },
      }}
    >
      <ModalBody style={{ padding: 0, margin: 0 }}>
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
          <Button
            onClick={() => onRent(unit)}
            disabled={!unit.is_available}
            overrides={{
              BaseButton: {
                style: {
                  width: '100%',
                  height: '3rem',
                  backgroundColor: 'rgba(255, 176, 205, 0.1)',
                  borderTopWidth: '1px',
                  borderRightWidth: '1px',
                  borderBottomWidth: '1px',
                  borderLeftWidth: '1px',
                  borderTopStyle: 'solid',
                  borderRightStyle: 'solid',
                  borderBottomStyle: 'solid',
                  borderLeftStyle: 'solid',
                  borderTopColor: 'rgba(255, 176, 205, 0.3)',
                  borderRightColor: 'rgba(255, 176, 205, 0.3)',
                  borderBottomColor: 'rgba(255, 176, 205, 0.3)',
                  borderLeftColor: 'rgba(255, 176, 205, 0.3)',
                  borderTopLeftRadius: '0.75rem',
                  borderTopRightRadius: '0.75rem',
                  borderBottomLeftRadius: '0.75rem',
                  borderBottomRightRadius: '0.75rem',
                  color: '#ffb0cd',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '1rem',
                  ':hover': {
                    backgroundColor: 'rgba(255, 176, 205, 0.2)',
                  },
                  ':disabled': {
                    opacity: 0.4,
                    cursor: 'not-allowed',
                  },
                },
              },
            }}
          >
            RENT WITH KLARNA
          </Button>
        </div>
      </ModalBody>
    </Modal>
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
