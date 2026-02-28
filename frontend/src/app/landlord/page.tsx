"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import VoiceVisualizer from "@/components/landlord/VoiceVisualizer";
import PushToTalk from "@/components/landlord/PushToTalk";

type VoiceState = "idle" | "recording" | "processing" | "playing";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_LABELS: Record<VoiceState, string> = {
  idle: "AWAITING INPUT",
  recording: "RECORDING",
  processing: "PROCESSING",
  playing: "SPEAKING",
};

export default function LandlordVoicePage() {
  const { token } = useAuth();
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob) => {
      if (!token) {
        setError("AUTHENTICATION REQUIRED. ACCESS DENIED.");
        return;
      }

      setState("processing");
      setError(null);

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "audio.webm");

        const response = await fetch(`${API_BASE}/api/chat/voice`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`RESPONSE CODE ${response.status}`);
        }

        const audioResponse = await response.blob();
        const audioUrl = URL.createObjectURL(audioResponse);

        // Clean up previous audio URL
        if (audioRef.current) {
          URL.revokeObjectURL(audioRef.current.src);
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        setState("playing");

        audio.onended = () => {
          setState("idle");
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setError("AUDIO PLAYBACK FAILURE.");
          setState("idle");
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        await audio.play();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "UNKNOWN TRANSMISSION ERROR";
        setError(message);
        setState("idle");
      }
    },
    [token]
  );

  const handleRecordingStart = useCallback(() => {
    setState("recording");
    setError(null);
  }, []);

  return (
    <div className="fixed inset-0 bg-surface-page flex flex-col overflow-hidden">
      {/* Ambient background gradient */}
      <div
        className={`absolute inset-0 transition-all duration-1000 pointer-events-none ${
          state === "idle"
            ? "bg-[radial-gradient(ellipse_at_center,rgba(50,17,212,0.05)_0%,transparent_70%)]"
            : state === "recording"
              ? "bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.06)_0%,transparent_70%)]"
              : state === "processing"
                ? "bg-[radial-gradient(ellipse_at_center,rgba(88,53,245,0.06)_0%,transparent_70%)]"
                : "bg-[radial-gradient(ellipse_at_center,rgba(0,204,102,0.05)_0%,transparent_70%)]"
        }`}
      />

      {/* Scan line overlay for dystopian feel */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-start justify-between px-6 pt-6">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors group"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span className="label-tracked">EXIT</span>
        </Link>

        {/* Title & status - centered */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <h1 className="text-sm font-medium tracking-[0.3em] text-zinc-400 uppercase">
            LANDLORD AI{" "}
            <span className="text-zinc-600 text-xs font-normal">v2.4.1</span>
          </h1>
          <p
            className={`mt-1.5 label-tracked transition-colors duration-500 ${
              state === "idle"
                ? "text-zinc-600"
                : state === "recording"
                  ? "text-accent-red/80"
                  : state === "processing"
                    ? "text-primary-light/80"
                    : "text-accent-green/80"
            }`}
          >
            {STATUS_LABELS[state]}
          </p>
        </div>

        {/* Spacer for layout balance */}
        <div className="w-[72px]" />
      </div>

      {/* Center: Voice Visualizer */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <VoiceVisualizer state={state} />
      </div>

      {/* Error display */}
      {error && (
        <div className="relative z-10 flex justify-center -mt-8 mb-4">
          <p className="label-tracked text-accent-red/70 max-w-xs text-center">
            {error}
          </p>
        </div>
      )}

      {/* Bottom: Push to Talk */}
      <div className="relative z-10 flex justify-center pb-12">
        <PushToTalk
          onRecordingComplete={handleRecordingComplete}
          isDisabled={state === "processing" || state === "playing"}
          state={state}
          onRecordingStart={handleRecordingStart}
        />
      </div>
    </div>
  );
}
