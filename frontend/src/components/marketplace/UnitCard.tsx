"use client";

import type { Unit } from "@/lib/types";

interface UnitCardProps {
  unit: Unit;
  onClick: (unit: Unit) => void;
  userScore?: number;
}

function bedroomLabel(bedrooms: number): string {
  if (bedrooms === 0) return "Studio";
  if (bedrooms === 1) return "1 Bed";
  return `${bedrooms} Bed`;
}

export default function UnitCard({ unit, onClick, userScore = 0 }: UnitCardProps) {
  const meetsScoreRequirement = userScore >= unit.community_score_required;
  return (
    <div
      onClick={() => onClick(unit)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white border border-gray-200 transition-shadow hover:shadow-md"
    >
      {/* Image placeholder header */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <div className="flex h-full w-full items-center justify-center">
          <img
            src="/illustrations/standing-3.svg"
            alt=""
            className="h-24 w-24 opacity-20"
          />
        </div>

        {/* Availability badge */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/90 px-3 py-1 backdrop-blur-md">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              unit.is_available ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-900">
            {unit.is_available ? "Available" : "Occupied"}
          </span>
        </div>

        {/* Unit name overlay */}
        <div className="absolute bottom-4 left-4">
          <h3 className="text-xl font-bold tracking-tight text-gray-900">
            {unit.name}
          </h3>
          <p className="text-sm text-gray-500">
            {unit.sector} &bull; Floor {unit.floor}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Price + badges */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Monthly Rent
            </span>
            <span className="text-2xl font-bold text-gray-900">
              ${unit.monthly_rent_usd.toLocaleString()}
              <span className="text-sm font-normal text-gray-500">/mo</span>
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
              {unit.sector}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {bedroomLabel(unit.bedrooms)}
          </span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {unit.bathrooms} Bath
          </span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {unit.sqft.toLocaleString()} sqft
          </span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            Floor {unit.floor}
          </span>
          {unit.pet_policy !== "none" && (
            <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              {unit.pet_policy === "cats_only"
                ? "Cats OK"
                : unit.pet_policy === "dogs_only"
                ? "Dogs OK"
                : "Pets OK"}
            </span>
          )}
          {unit.parking !== "none" && (
            <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              Parking
            </span>
          )}
          {unit.smart_home && (
            <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
              Smart Home
            </span>
          )}
        </div>

        {/* Community Score requirement */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Community Score:
          </span>
          <span className={`text-xs font-bold ${meetsScoreRequirement ? "text-green-600" : "text-red-500"}`}>
            {unit.community_score_required}+
          </span>
          {!meetsScoreRequirement && (
            <span className="text-[10px] text-red-400">Ineligible</span>
          )}
        </div>

        {/* Klarna CTA */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (meetsScoreRequirement) onClick(unit);
          }}
          disabled={!meetsScoreRequirement}
          className={`mt-auto flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors ${
            meetsScoreRequirement
              ? "bg-[#FFB3C7] text-black hover:bg-[#FFA0B8]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {meetsScoreRequirement
            ? <>Apply with <img src="/klarna.png" alt="Klarna" className="h-4 inline-block" /></>
            : "Score Too Low"
          }
        </button>
      </div>
    </div>
  );
}
