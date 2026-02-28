"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { rateNeighbor } from "@/lib/api";
import {
  Modal,
  ModalBody,
  ModalFooter,
} from "baseui/modal";
import { Button, KIND, SIZE as BUTTON_SIZE } from "baseui/button";
import { Select } from "baseui/select";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NEIGHBORS = [
  { citizen_id: "CIT-7291", userId: 1 },
  { citizen_id: "CIT-0042", userId: 2 },
  { citizen_id: "CIT-9999", userId: 3 },
] as const;

interface StarSelectorProps {
  label: string;
  sublabel: string;
  value: number;
  onChange: (v: number) => void;
}

function StarSelector({ label, sublabel, value, onChange }: StarSelectorProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            {label}
          </span>
          <span className="text-[10px] text-zinc-500 ml-2">{sublabel}</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          {value > 0 ? `${value}/5` : "---"}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onChange(star)}
            >
              <svg
                className={`w-6 h-6 transition-colors ${
                  filled ? "text-amber-400" : "text-zinc-600"
                }`}
                fill={filled ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={filled ? 0 : 1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RatingModal({ isOpen, onClose }: RatingModalProps) {
  const { token, user } = useAuth();
  const [selectedNeighbor, setSelectedNeighbor] = useState("");
  const [noise, setNoise] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [loyalty, setLoyalty] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out current user from neighbor list
  const availableNeighbors = NEIGHBORS.filter(
    (n) => n.citizen_id !== user?.citizen_id
  );

  const canSubmit =
    selectedNeighbor && noise > 0 && cleanliness > 0 && loyalty > 0;

  async function handleSubmit() {
    if (!token || !canSubmit) return;

    const neighbor = NEIGHBORS.find((n) => n.citizen_id === selectedNeighbor);
    if (!neighbor) return;

    setSubmitting(true);
    setError(null);

    try {
      await rateNeighbor(token, neighbor.userId, noise, cleanliness, loyalty);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Evaluation submission failed. Report to your sector warden.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSelectedNeighbor("");
    setNoise(0);
    setCleanliness(0);
    setLoyalty(0);
    setSuccess(false);
    setError(null);
    onClose();
  }

  const neighborOptions = [
    { id: "", label: "-- Choose neighbor --" },
    ...availableNeighbors.map((n) => ({ id: n.citizen_id, label: n.citizen_id })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      overrides={{
        Root: {
          style: {
            zIndex: 50,
          },
        },
        Dialog: {
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
            borderTopLeftRadius: '0.5rem',
            borderTopRightRadius: '0.5rem',
            borderBottomLeftRadius: '0.5rem',
            borderBottomRightRadius: '0.5rem',
            maxWidth: '28rem',
            width: '100%',
            overflow: 'hidden',
            padding: '0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          },
        },
        DialogContainer: {
          style: {
            backdropFilter: 'blur(4px)',
          },
        },
        Close: {
          style: {
            display: 'none',
          },
        },
      }}
    >
      <ModalBody style={{ padding: 0, margin: 0 }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2b2839] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-300">
              Citizen Evaluation Form
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {success ? (
            <div className="py-6 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm text-zinc-300 font-medium">
                Evaluation recorded.
              </p>
              <p className="text-xs text-zinc-500 max-w-xs">
                Social credit has been adjusted accordingly.
              </p>
              <Button
                onClick={handleClose}
                kind={KIND.secondary}
                size={BUTTON_SIZE.compact}
                overrides={{
                  BaseButton: {
                    style: {
                      marginTop: '0.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
                      color: '#d4d4d8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      ':hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                  },
                }}
              >
                Dismiss
              </Button>
            </div>
          ) : (
            <>
              {/* Neighbor select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Select Subject
                </label>
                <Select
                  clearable={false}
                  searchable={false}
                  options={neighborOptions}
                  value={selectedNeighbor ? [neighborOptions.find((o) => o.id === selectedNeighbor)!] : []}
                  placeholder="-- Choose neighbor --"
                  onChange={({ value }) => {
                    if (value.length > 0 && value[0].id !== "") {
                      setSelectedNeighbor(value[0].id as string);
                    } else {
                      setSelectedNeighbor("");
                    }
                  }}
                  overrides={{
                    Root: {
                      style: {
                        backgroundColor: 'transparent',
                      },
                    },
                    ControlContainer: {
                      style: {
                        backgroundColor: '#131022',
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
                        borderTopLeftRadius: '0.25rem',
                        borderTopRightRadius: '0.25rem',
                        borderBottomLeftRadius: '0.25rem',
                        borderBottomRightRadius: '0.25rem',
                      },
                    },
                    ValueContainer: {
                      style: {
                        color: '#e4e4e7',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                      },
                    },
                    SingleValue: {
                      style: {
                        color: '#e4e4e7',
                      },
                    },
                    Dropdown: {
                      style: {
                        backgroundColor: '#131022',
                        borderTopColor: '#2b2839',
                        borderRightColor: '#2b2839',
                        borderBottomColor: '#2b2839',
                        borderLeftColor: '#2b2839',
                      },
                    },
                    DropdownListItem: {
                      style: {
                        color: '#e4e4e7',
                        backgroundColor: '#131022',
                        ':hover': {
                          backgroundColor: '#2b2839',
                        },
                      },
                    },
                    OptionContent: {
                      style: {
                        color: '#e4e4e7',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
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
                  }}
                />
              </div>

              {/* Rating categories */}
              <div className="flex flex-col gap-4 pt-1">
                <StarSelector
                  label="Noise Compliance"
                  sublabel="1=disruptive, 5=silent"
                  value={noise}
                  onChange={setNoise}
                />
                <StarSelector
                  label="Cleanliness Score"
                  sublabel="1=violation, 5=exemplary"
                  value={cleanliness}
                  onChange={setCleanliness}
                />
                <StarSelector
                  label="Loyalty Index"
                  sublabel="1=subversive, 5=devoted"
                  value={loyalty}
                  onChange={setLoyalty}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                isLoading={submitting}
                overrides={{
                  BaseButton: {
                    style: {
                      width: '100%',
                      paddingTop: '0.625rem',
                      paddingBottom: '0.625rem',
                      borderTopLeftRadius: '0.25rem',
                      borderTopRightRadius: '0.25rem',
                      borderBottomLeftRadius: '0.25rem',
                      borderBottomRightRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      ...(canSubmit && !submitting
                        ? {
                            backgroundColor: '#3211d4',
                            color: '#ffffff',
                            boxShadow: '0 10px 15px -3px rgba(50, 17, 212, 0.2)',
                            ':hover': {
                              backgroundColor: '#4422e5',
                            },
                          }
                        : {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#52525b',
                            cursor: 'not-allowed',
                          }),
                    },
                  },
                }}
              >
                {submitting ? "Processing..." : "Submit Evaluation"}
              </Button>
            </>
          )}
        </div>
      </ModalBody>

      {/* Footer */}
      <ModalFooter
        style={{
          padding: '0.625rem 1.5rem',
          borderTop: '1px solid #2b2839',
          backgroundColor: 'rgba(255, 255, 255, 0.01)',
          margin: 0,
        }}
      >
        <p className="text-[9px] text-zinc-600 italic">
          * All evaluations are anonymous and permanently recorded. Retaliatory
          ratings may result in social credit penalties.
        </p>
      </ModalFooter>
    </Modal>
  );
}
