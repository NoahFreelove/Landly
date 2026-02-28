"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import FilterBar from "@/components/marketplace/FilterBar";
import UnitCard from "@/components/marketplace/UnitCard";
import UnitDetailModal from "@/components/marketplace/UnitDetailModal";
import KlarnaCheckout from "@/components/marketplace/KlarnaCheckout";
import { getUnits } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Unit } from "@/lib/types";

interface Filters {
  sector: string;
  priceRange: string;
  sortBy: string;
}

export default function MarketplacePage() {
  const { token } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    sector: "all",
    priceRange: "all",
    sortBy: "price-asc",
  });

  // Modal state
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Fetch units
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getUnits(token)
      .then((data) => {
        setUnits(data);
        setError(null);
      })
      .catch((err) => setError(err.message || "Failed to load units"))
      .finally(() => setLoading(false));
  }, [token]);

  // Unique sectors
  const sectors = useMemo(
    () => Array.from(new Set(units.map((u) => u.sector))).sort(),
    [units]
  );

  // Filtered + sorted units
  const displayUnits = useMemo(() => {
    let result = [...units];

    // Sector filter
    if (filters.sector !== "all") {
      result = result.filter((u) => u.sector === filters.sector);
    }

    // Price filter
    if (filters.priceRange === "under-1000") {
      result = result.filter((u) => u.monthly_rent_usd < 1000);
    } else if (filters.priceRange === "1000-2000") {
      result = result.filter(
        (u) => u.monthly_rent_usd >= 1000 && u.monthly_rent_usd <= 2000
      );
    } else if (filters.priceRange === "2000-plus") {
      result = result.filter((u) => u.monthly_rent_usd > 2000);
    }

    // Sort
    switch (filters.sortBy) {
      case "price-asc":
        result.sort((a, b) => a.monthly_rent_usd - b.monthly_rent_usd);
        break;
      case "price-desc":
        result.sort((a, b) => b.monthly_rent_usd - a.monthly_rent_usd);
        break;
      case "newest":
        result.sort((a, b) => b.year_built - a.year_built);
        break;
      case "size":
        result.sort((a, b) => b.sqft - a.sqft);
        break;
    }

    return result;
  }, [units, filters]);

  // Handlers
  const handleCardClick = useCallback((unit: Unit) => {
    setSelectedUnit(unit);
    setDetailOpen(true);
  }, []);

  const handleRent = useCallback((unit: Unit) => {
    setSelectedUnit(unit);
    setDetailOpen(false);
    setCheckoutOpen(true);
  }, []);

  const handleCheckoutComplete = useCallback(() => {
    // Refresh units to reflect changes
    if (token) {
      getUnits(token).then(setUnits).catch(() => {});
    }
  }, [token]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tighter text-gray-900 md:text-5xl">
              Available Apartments
            </h1>
            <p className="max-w-2xl text-lg text-gray-500">
              Find your next home. Modern living starts here.
            </p>
          </div>
          <img src="/illustrations/standing-3.svg" alt="" className="w-40 opacity-40" />
        </div>

        {/* Filters */}
        <FilterBar onFilter={setFilters} sectors={sectors} />

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{displayUnits.length}</span>{" "}
            units found
          </p>
          {filters.sector !== "all" && (
            <button
              onClick={() =>
                setFilters((f) => ({ ...f, sector: "all" }))
              }
              className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
            >
              Clear sector filter
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            <p className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Loading available listings...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-red-50 p-8 ring-1 ring-red-200">
            <p className="text-sm font-bold uppercase tracking-wider text-red-600">
              Unable to Load Listings
            </p>
            <p className="text-xs text-gray-500">{error}</p>
            <button
              onClick={() => {
                if (token) {
                  setLoading(true);
                  getUnits(token)
                    .then(setUnits)
                    .catch(() => {})
                    .finally(() => setLoading(false));
                }
              }}
              className="mt-2 rounded-lg bg-gray-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-900 ring-1 ring-gray-200 hover:bg-gray-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && displayUnits.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-lg font-bold text-gray-500">
              No units match your criteria
            </p>
            <p className="text-sm text-gray-400">
              Try adjusting your filters to see more results.
            </p>
          </div>
        )}

        {/* Unit grid */}
        {!loading && !error && displayUnits.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                onClick={handleCardClick}
              />
            ))}
          </div>
        )}

        {/* Footer fine print */}
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            All listings subject to Community Score verification. Smart Home features vary by unit.
          </p>
        </div>
      </div>

      {/* Modals */}
      <UnitDetailModal
        unit={selectedUnit}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRent={handleRent}
      />

      <KlarnaCheckout
        unit={selectedUnit}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onComplete={handleCheckoutComplete}
      />
    </AppLayout>
  );
}
