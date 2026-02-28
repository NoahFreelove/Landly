"use client";

import { useState } from "react";

interface FilterState {
  sector: string;
  priceRange: string;
  sortBy: string;
}

interface FilterBarProps {
  onFilter: (filters: FilterState) => void;
  sectors: string[];
}

export default function FilterBar({ onFilter, sectors }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    sector: "all",
    priceRange: "all",
    sortBy: "price-asc",
  });

  function update(key: keyof FilterState, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilter(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-elevated p-4 ring-1 ring-border">
      {/* Sector */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Sector
        </label>
        <select
          value={filters.sector}
          onChange={(e) => update("sector", e.target.value)}
          className="h-9 rounded-lg border-none bg-surface-card px-3 pr-8 text-sm font-medium text-white ring-1 ring-border focus:ring-primary"
        >
          <option value="all">All Sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Price Range
        </label>
        <select
          value={filters.priceRange}
          onChange={(e) => update("priceRange", e.target.value)}
          className="h-9 rounded-lg border-none bg-surface-card px-3 pr-8 text-sm font-medium text-white ring-1 ring-border focus:ring-primary"
        >
          <option value="all">Any Price</option>
          <option value="under-1000">Under $1,000/mo</option>
          <option value="1000-2000">$1,000 - $2,000/mo</option>
          <option value="2000-plus">$2,000+/mo</option>
        </select>
      </div>

      {/* Sort By */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => update("sortBy", e.target.value)}
          className="h-9 rounded-lg border-none bg-surface-card px-3 pr-8 text-sm font-medium text-white ring-1 ring-border focus:ring-primary"
        >
          <option value="price-asc">Price (Low-High)</option>
          <option value="price-desc">Price (High-Low)</option>
          <option value="radiation">Radiation Level</option>
          <option value="oxygen">Oxygen Quality</option>
        </select>
      </div>

      {/* Decorative tag */}
      <div className="ml-auto hidden items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-light ring-1 ring-primary/20 sm:flex">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-light" />
        Live Inventory
      </div>
    </div>
  );
}
