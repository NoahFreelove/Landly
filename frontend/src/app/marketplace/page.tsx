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
      case "radiation":
        result.sort((a, b) => b.radiation_level - a.radiation_level);
        break;
      case "oxygen":
        result.sort((a, b) => b.oxygen_quality - a.oxygen_quality);
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
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tighter text-white md:text-5xl">
            <span className="text-primary-light">Available</span> Life Pods
          </h1>
          <p className="max-w-2xl text-lg text-zinc-400">
            Secure your standardized living unit today. Compliance is mandatory
            for all citizens. Units subject to availability and social credit
            standing.
          </p>
        </div>

        {/* Filters */}
        <FilterBar onFilter={setFilters} sectors={sectors} />

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            <span className="font-bold text-white">{displayUnits.length}</span>{" "}
            units found
          </p>
          {filters.sector !== "all" && (
            <button
              onClick={() =>
                setFilters((f) => ({ ...f, sector: "all" }))
              }
              className="text-xs font-bold uppercase tracking-wider text-primary-light hover:text-white transition-colors"
            >
              Clear sector filter
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-light border-t-transparent" />
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Scanning available sectors...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-accent-red/10 p-8 ring-1 ring-accent-red/20">
            <p className="text-sm font-bold uppercase tracking-wider text-accent-red">
              Sector Data Unavailable
            </p>
            <p className="text-xs text-zinc-400">{error}</p>
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
              className="mt-2 rounded-lg bg-surface-elevated px-4 py-2 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-border hover:bg-surface-card"
            >
              Retry Scan
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && displayUnits.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-lg font-bold text-zinc-400">
              No units match your criteria
            </p>
            <p className="text-sm text-zinc-600">
              Adjust your filters or accept whatever the Authority assigns you.
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

        {/* Dystopian fine print */}
        <div className="border-t border-border pt-6 text-center">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600">
            All listings are final. Rental agreements are binding under Directive
            7.4.2. Klarna financing subject to 35% APR. Social credit score
            will be evaluated at point of application. The Authority reserves
            the right to reassign, repossess, or revoke housing privileges at
            any time without prior notice. Resistance is inadvisable.
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
