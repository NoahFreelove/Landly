"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  getCurrentDate,
  advanceDay as apiAdvanceDay,
  advanceMonth as apiAdvanceMonth,
} from "@/lib/api";
import { Button, KIND, SIZE } from "baseui/button";

export default function TimeBar() {
  const { token } = useAuth();
  const [simDate, setSimDate] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const fetchDate = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getCurrentDate(token);
      setSimDate(data.current_date ?? data.date ?? JSON.stringify(data));
    } catch {
      // API may not be running yet
      setSimDate("--");
    }
  }, [token]);

  useEffect(() => {
    fetchDate();
  }, [fetchDate]);

  const handleAdvanceDay = async () => {
    if (!token || isAdvancing) return;
    setIsAdvancing(true);
    try {
      await apiAdvanceDay(token);
      await fetchDate();
      window.dispatchEvent(new CustomEvent("time-advanced"));
    } catch {
      // silently fail
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdvanceMonth = async () => {
    if (!token || isAdvancing) return;
    setIsAdvancing(true);
    try {
      await apiAdvanceMonth(token);
      await fetchDate();
      window.dispatchEvent(new CustomEvent("time-advanced"));
    } catch {
      // silently fail
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 flex h-12 w-full items-center justify-between border-t border-gray-200 bg-white px-6">
      {/* Left: simulation date */}
      <div className="flex items-center gap-3 pl-[250px]">
        <span className="text-[10px] uppercase tracking-wider text-gray-500">
          Simulation Date
        </span>
        <span className="text-sm font-semibold text-gray-900">
          {simDate ?? "..."}
        </span>
      </div>

      {/* Right: advance buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleAdvanceDay}
          disabled={isAdvancing}
          kind={KIND.secondary}
          size={SIZE.mini}
          overrides={{
            BaseButton: {
              style: {
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                borderTopColor: '#BFDBFE',
                borderRightColor: '#BFDBFE',
                borderBottomColor: '#BFDBFE',
                borderLeftColor: '#BFDBFE',
                borderTopWidth: '1px',
                borderRightWidth: '1px',
                borderBottomWidth: '1px',
                borderLeftWidth: '1px',
                borderTopStyle: 'solid',
                borderRightStyle: 'solid',
                borderBottomStyle: 'solid',
                borderLeftStyle: 'solid',
                borderTopLeftRadius: '0.5rem',
                borderTopRightRadius: '0.5rem',
                borderBottomLeftRadius: '0.5rem',
                borderBottomRightRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem',
                paddingTop: '0.25rem',
                paddingBottom: '0.25rem',
                ':hover': {
                  backgroundColor: '#DBEAFE',
                },
                ':disabled': {
                  opacity: 0.4,
                },
              },
            },
          }}
        >
          {isAdvancing ? "..." : "Advance Day"}
        </Button>
        <Button
          onClick={handleAdvanceMonth}
          disabled={isAdvancing}
          kind={KIND.secondary}
          size={SIZE.mini}
          overrides={{
            BaseButton: {
              style: {
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                borderTopColor: '#BFDBFE',
                borderRightColor: '#BFDBFE',
                borderBottomColor: '#BFDBFE',
                borderLeftColor: '#BFDBFE',
                borderTopWidth: '1px',
                borderRightWidth: '1px',
                borderBottomWidth: '1px',
                borderLeftWidth: '1px',
                borderTopStyle: 'solid',
                borderRightStyle: 'solid',
                borderBottomStyle: 'solid',
                borderLeftStyle: 'solid',
                borderTopLeftRadius: '0.5rem',
                borderTopRightRadius: '0.5rem',
                borderBottomLeftRadius: '0.5rem',
                borderBottomRightRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem',
                paddingTop: '0.25rem',
                paddingBottom: '0.25rem',
                ':hover': {
                  backgroundColor: '#DBEAFE',
                },
                ':disabled': {
                  opacity: 0.4,
                },
              },
            },
          }}
        >
          {isAdvancing ? "..." : "Advance Month"}
        </Button>
      </div>
    </div>
  );
}
