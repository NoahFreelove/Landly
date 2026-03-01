"use client";

import type { Unit } from "@/lib/types";
import {
  Modal,
  ModalBody,
  SIZE as MODAL_SIZE,
} from "baseui/modal";
import { Button } from "baseui/button";

const APARTMENT_PHOTOS = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
  "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80",
];

function getUnitPhoto(unitId: number): string {
  return APARTMENT_PHOTOS[unitId % APARTMENT_PHOTOS.length];
}

interface UnitDetailModalProps {
  unit: Unit | null;
  isOpen: boolean;
  onClose: () => void;
  onRent: (unit: Unit) => void;
  userScore?: number;
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
  userScore = 0,
}: UnitDetailModalProps) {
  if (!unit) return null;

  const meetsScoreRequirement = userScore >= unit.community_score_required;

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
        {/* Header with photo */}
        <div className="relative">
          <img
            src={getUnitPhoto(unit.id)}
            alt={unit.name}
            className="w-full h-48 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8 pt-16">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">
              Apartment Details
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">
              {unit.name}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {unit.sector} &bull; Floor {unit.floor} &bull; {unit.sqft.toLocaleString()} sqft
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${unit.is_available ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {unit.is_available ? "Available" : "Currently Occupied"}
              </span>
            </div>
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
            <p className={`text-xs ${meetsScoreRequirement ? "text-gray-500" : "text-red-500 font-medium"}`}>
              {meetsScoreRequirement
                ? `This unit requires a minimum Community Score of ${unit.community_score_required}.`
                : `Your Community Score does not meet the minimum requirement of ${unit.community_score_required}.`}
            </p>
            {unit.smart_home && (
              <p className="text-xs text-gray-500">
                Smart Home monitoring included.
              </p>
            )}
          </div>
          <Button
            onClick={() => onRent(unit)}
            disabled={!unit.is_available || !meetsScoreRequirement}
            overrides={{
              BaseButton: {
                style: {
                  width: '100%',
                  height: '3rem',
                  backgroundColor: meetsScoreRequirement ? '#FFB3C7' : '#f3f4f6',
                  borderTopLeftRadius: '0.75rem',
                  borderTopRightRadius: '0.75rem',
                  borderBottomLeftRadius: '0.75rem',
                  borderBottomRightRadius: '0.75rem',
                  color: meetsScoreRequirement ? '#000000' : '#9ca3af',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  fontSize: '1rem',
                  ':hover': {
                    backgroundColor: meetsScoreRequirement ? '#FFA0B8' : '#f3f4f6',
                  },
                  ':disabled': {
                    opacity: meetsScoreRequirement ? 0.4 : 1,
                    cursor: 'not-allowed',
                  },
                },
              },
            }}
          >
            {meetsScoreRequirement
              ? <span className="flex items-center gap-2">Apply with <img src="/klarna.png" alt="Klarna" style={{ height: '1rem', display: 'inline-block' }} /></span>
              : "Score Too Low"
            }
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
