"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { rateNeighbor } from "@/lib/api";

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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-card border border-[#2b2839] rounded-lg w-full max-w-md mx-4 shadow-2xl shadow-black/50">
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
              <button
                onClick={handleClose}
                className="mt-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 bg-white/5 border border-[#2b2839] rounded hover:bg-white/10 transition-colors"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <>
              {/* Neighbor select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Select Subject
                </label>
                <select
                  value={selectedNeighbor}
                  onChange={(e) => setSelectedNeighbor(e.target.value)}
                  className="bg-surface-page border border-[#2b2839] rounded px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-primary-light transition-colors appearance-none cursor-pointer"
                >
                  <option value="">-- Choose neighbor --</option>
                  {availableNeighbors.map((n) => (
                    <option key={n.citizen_id} value={n.citizen_id}>
                      {n.citizen_id}
                    </option>
                  ))}
                </select>
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
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className={`w-full py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  canSubmit && !submitting
                    ? "bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20"
                    : "bg-white/5 text-zinc-600 cursor-not-allowed"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Submit Evaluation"
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-[#2b2839] bg-white/[0.01]">
          <p className="text-[9px] text-zinc-600 italic">
            * All evaluations are anonymous and permanently recorded. Retaliatory
            ratings may result in social credit penalties.
          </p>
        </div>
      </div>
    </div>
  );
}
