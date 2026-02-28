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
    } catch {
      // silently fail
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 flex h-12 w-full items-center justify-between border-t border-[#2b2839] bg-surface-card/90 px-6 backdrop-blur-md">
      {/* Left: simulation date */}
      <div className="flex items-center gap-3 pl-[250px]">
        <span className="label-tracked text-[10px] text-zinc-500">
          Simulation Date
        </span>
        <span className="text-sm font-semibold tracking-wide text-zinc-200">
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
                borderTopLeftRadius: '0.25rem',
                borderTopRightRadius: '0.25rem',
                borderBottomLeftRadius: '0.25rem',
                borderBottomRightRadius: '0.25rem',
                color: '#a1a1aa',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem',
                paddingTop: '0.25rem',
                paddingBottom: '0.25rem',
                ':hover': {
                  borderTopColor: 'rgba(50, 17, 212, 0.5)',
                  borderRightColor: 'rgba(50, 17, 212, 0.5)',
                  borderBottomColor: 'rgba(50, 17, 212, 0.5)',
                  borderLeftColor: 'rgba(50, 17, 212, 0.5)',
                  color: '#a78bfa',
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
                borderTopLeftRadius: '0.25rem',
                borderTopRightRadius: '0.25rem',
                borderBottomLeftRadius: '0.25rem',
                borderBottomRightRadius: '0.25rem',
                color: '#a1a1aa',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem',
                paddingTop: '0.25rem',
                paddingBottom: '0.25rem',
                ':hover': {
                  borderTopColor: 'rgba(50, 17, 212, 0.5)',
                  borderRightColor: 'rgba(50, 17, 212, 0.5)',
                  borderBottomColor: 'rgba(50, 17, 212, 0.5)',
                  borderLeftColor: 'rgba(50, 17, 212, 0.5)',
                  color: '#a78bfa',
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
