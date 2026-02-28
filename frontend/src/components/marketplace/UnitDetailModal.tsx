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

function bedroomLabel(bedrooms: number): string {
  if (bedrooms === 0) return "Studio";
  if (bedrooms === 1) return "1 Bed";
  return `${bedrooms} Bed`;
}

export default function UnitDetailModal({
  unit,
  isOpen,
  onClose,
  onRent,
}: UnitDetailModalProps) {
  if (!unit) return null;

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
            backgroundColor: '#FFFFFF',
            borderTopColor: '#e5e7eb',
            borderRightColor: '#e5e7eb',
            borderBottomColor: '#e5e7eb',
            borderLeftColor: '#e5e7eb',
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
            color: '#9ca3af',
            ':hover': {
              color: '#4b5563',
            },
          },
        },
      }}
    >
      <ModalBody style={{ padding: 0, margin: 0 }}>
        {/* Header */}
        <div className="relative bg-gray-50 p-8 pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Apartment Details
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            {unit.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {unit.sector} &bull; Floor {unit.floor} &bull; {unit.sqft.toLocaleString()} sqft
          </p>

          {/* Availability */}
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                unit.is_available ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
              {unit.is_available
                ? "Available"
                : "Currently Occupied"}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px bg-gray-200 sm:grid-cols-4">
          <StatCell label="Monthly Rent" value={`$${unit.monthly_rent_usd.toLocaleString()}`} sub="/mo" />
          <StatCell label="Size" value={`${unit.sqft.toLocaleString()}`} sub="sqft" />
          <StatCell label="Layout" value={bedroomLabel(unit.bedrooms)} sub={`${unit.bathrooms} Bath`} />
          <StatCell label="Floor" value={`${unit.floor}`} />
          <StatCell label="Pet Policy" value={unit.pet_policy === "none" ? "No Pets" : unit.pet_policy === "cats_only" ? "Cats Only" : unit.pet_policy === "dogs_only" ? "Dogs Only" : "Pets OK"} />
          <StatCell label="Parking" value={unit.parking === "none" ? "None" : unit.parking === "garage" ? "Garage" : unit.parking === "street" ? "Street" : unit.parking} />
          <StatCell label="Laundry" value={unit.laundry === "in_unit" ? "In-Unit" : unit.laundry === "in_building" ? "In-Building" : unit.laundry === "none" ? "None" : unit.laundry} />
          <StatCell label="Year Built" value={`${unit.year_built}`} />
        </div>

        {/* Action area */}
        <div className="flex flex-col gap-3 p-6">
          <div className="flex flex-col gap-1 text-center">
            <p className="text-xs text-gray-500">
              This unit requires a minimum Community Score of {unit.community_score_required}.
            </p>
            {unit.smart_home && (
              <p className="text-xs text-gray-500">
                Smart Home monitoring included.
              </p>
            )}
          </div>
          <Button
            onClick={() => onRent(unit)}
            disabled={!unit.is_available}
            overrides={{
              BaseButton: {
                style: {
                  width: '100%',
                  height: '3rem',
                  backgroundColor: 'rgba(255, 179, 199, 0.1)',
                  borderTopWidth: '1px',
                  borderRightWidth: '1px',
                  borderBottomWidth: '1px',
                  borderLeftWidth: '1px',
                  borderTopStyle: 'solid',
                  borderRightStyle: 'solid',
                  borderBottomStyle: 'solid',
                  borderLeftStyle: 'solid',
                  borderTopColor: 'rgba(255, 179, 199, 0.3)',
                  borderRightColor: 'rgba(255, 179, 199, 0.3)',
                  borderBottomColor: 'rgba(255, 179, 199, 0.3)',
                  borderLeftColor: 'rgba(255, 179, 199, 0.3)',
                  borderTopLeftRadius: '0.75rem',
                  borderTopRightRadius: '0.75rem',
                  borderBottomLeftRadius: '0.75rem',
                  borderBottomRightRadius: '0.75rem',
                  color: '#FFB3C7',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  fontSize: '1rem',
                  ':hover': {
                    backgroundColor: 'rgba(255, 179, 199, 0.2)',
                  },
                  ':disabled': {
                    opacity: 0.4,
                    cursor: 'not-allowed',
                  },
                },
              },
            }}
          >
            Apply with Klarna
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
  valueColor = "text-gray-900",
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-white p-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        {label}
      </span>
      <span className={`text-lg font-bold ${valueColor}`}>
        {value}
        {sub && (
          <span className="ml-1 text-xs font-normal text-gray-500">{sub}</span>
        )}
      </span>
    </div>
  );
}
