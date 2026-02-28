"use client";

import { useState } from "react";
import { Select, SIZE as SELECT_SIZE } from "baseui/select";

interface FilterState {
  sector: string;
  priceRange: string;
  sortBy: string;
}

interface FilterBarProps {
  onFilter: (filters: FilterState) => void;
  sectors: string[];
}

const darkSelectOverrides = {
  Root: {
    style: {
      backgroundColor: 'transparent',
    },
  },
  ControlContainer: {
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
      borderTopStyle: 'solid' as const,
      borderRightStyle: 'solid' as const,
      borderBottomStyle: 'solid' as const,
      borderLeftStyle: 'solid' as const,
      borderTopLeftRadius: '0.5rem',
      borderTopRightRadius: '0.5rem',
      borderBottomLeftRadius: '0.5rem',
      borderBottomRightRadius: '0.5rem',
      minHeight: '36px',
    },
  },
  ValueContainer: {
    style: {
      color: '#ffffff',
      fontSize: '0.875rem',
      fontWeight: 500,
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem',
    },
  },
  SingleValue: {
    style: {
      color: '#ffffff',
    },
  },
  Dropdown: {
    style: {
      backgroundColor: '#1d1c27',
      borderTopColor: '#2b2839',
      borderRightColor: '#2b2839',
      borderBottomColor: '#2b2839',
      borderLeftColor: '#2b2839',
    },
  },
  DropdownListItem: {
    style: {
      color: '#e4e4e7',
      backgroundColor: '#1d1c27',
      ':hover': {
        backgroundColor: '#2b2839',
      },
    },
  },
  OptionContent: {
    style: {
      color: '#e4e4e7',
      fontSize: '0.875rem',
    },
  },
  SelectArrow: {
    style: {
      color: '#71717a',
    },
  },
  Placeholder: {
    style: {
      color: '#71717a',
    },
  },
  IconsContainer: {
    style: {
      paddingRight: '0.5rem',
    },
  },
};

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

  const sectorOptions = [
    { id: "all", label: "All Sectors" },
    ...sectors.map((s) => ({ id: s, label: s })),
  ];

  const priceOptions = [
    { id: "all", label: "Any Price" },
    { id: "under-1000", label: "Under $1,000/mo" },
    { id: "1000-2000", label: "$1,000 - $2,000/mo" },
    { id: "2000-plus", label: "$2,000+/mo" },
  ];

  const sortOptions = [
    { id: "price-asc", label: "Price (Low-High)" },
    { id: "price-desc", label: "Price (High-Low)" },
    { id: "radiation", label: "Radiation Level" },
    { id: "oxygen", label: "Oxygen Quality" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-elevated p-4 ring-1 ring-border">
      {/* Sector */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Sector
        </label>
        <div style={{ minWidth: '160px' }}>
          <Select
            size={SELECT_SIZE.compact}
            clearable={false}
            searchable={false}
            options={sectorOptions}
            value={[sectorOptions.find((o) => o.id === filters.sector) || sectorOptions[0]]}
            onChange={({ value }) => {
              if (value.length > 0) update("sector", value[0].id as string);
            }}
            overrides={darkSelectOverrides}
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Price Range
        </label>
        <div style={{ minWidth: '180px' }}>
          <Select
            size={SELECT_SIZE.compact}
            clearable={false}
            searchable={false}
            options={priceOptions}
            value={[priceOptions.find((o) => o.id === filters.priceRange) || priceOptions[0]]}
            onChange={({ value }) => {
              if (value.length > 0) update("priceRange", value[0].id as string);
            }}
            overrides={darkSelectOverrides}
          />
        </div>
      </div>

      {/* Sort By */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Sort By
        </label>
        <div style={{ minWidth: '180px' }}>
          <Select
            size={SELECT_SIZE.compact}
            clearable={false}
            searchable={false}
            options={sortOptions}
            value={[sortOptions.find((o) => o.id === filters.sortBy) || sortOptions[0]]}
            onChange={({ value }) => {
              if (value.length > 0) update("sortBy", value[0].id as string);
            }}
            overrides={darkSelectOverrides}
          />
        </div>
      </div>

      {/* Decorative tag */}
      <div className="ml-auto hidden items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-light ring-1 ring-primary/20 sm:flex">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-light" />
        Live Inventory
      </div>
    </div>
  );
}
