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

const lightSelectOverrides = {
  Root: {
    style: {
      backgroundColor: 'transparent',
    },
  },
  ControlContainer: {
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
      color: '#111827',
      fontSize: '0.875rem',
      fontWeight: 500,
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem',
    },
  },
  SingleValue: {
    style: {
      color: '#111827',
    },
  },
  Dropdown: {
    style: {
      backgroundColor: '#FFFFFF',
      borderTopColor: '#e5e7eb',
      borderRightColor: '#e5e7eb',
      borderBottomColor: '#e5e7eb',
      borderLeftColor: '#e5e7eb',
    },
  },
  DropdownListItem: {
    style: {
      color: '#374151',
      backgroundColor: '#FFFFFF',
      ':hover': {
        backgroundColor: '#f9fafb',
      },
    },
  },
  OptionContent: {
    style: {
      color: '#374151',
      fontSize: '0.875rem',
    },
  },
  SelectArrow: {
    style: {
      color: '#9ca3af',
    },
  },
  Placeholder: {
    style: {
      color: '#9ca3af',
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
    { id: "newest", label: "Newest" },
    { id: "size", label: "Size" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
      {/* Sector */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
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
            overrides={lightSelectOverrides}
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
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
            overrides={lightSelectOverrides}
          />
        </div>
      </div>

      {/* Sort By */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
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
            overrides={lightSelectOverrides}
          />
        </div>
      </div>

      {/* Decorative tag */}
      <div className="ml-auto hidden items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200 sm:flex">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
        Live Listings
      </div>
    </div>
  );
}
