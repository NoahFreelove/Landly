"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import VoiceVisualizer from "@/components/landlord/VoiceVisualizer";
import PushToTalk from "@/components/landlord/PushToTalk";

type VoiceState = "idle" | "recording" | "processing" | "playing";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_LABELS: Record<VoiceState, string> = {
  idle: "Ready",
  recording: "Listening...",
  processing: "Processing...",
  playing: "Speaking...",
};

export default function LandlordVoicePage() {
  const { token } = useAuth();
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clear chat history every time the assistant screen is opened
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/chat/history`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, [token]);

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob) => {
      if (!token) {
        setError("Authentication required. Please sign in.");
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
          throw new Error(`Request failed (${response.status})`);
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
          setError("Audio playback failed.");
          setState("idle");
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        await audio.play();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
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
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* Ambient background gradient */}
      <div
        className={`absolute inset-0 transition-all duration-1000 pointer-events-none ${
          state === "idle"
            ? "bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100"
            : state === "recording"
              ? "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50"
              : state === "processing"
                ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100"
                : "bg-gradient-to-br from-emerald-50 via-blue-50 to-gray-50"
        }`}
      />

      {/* Decorative illustration */}
      <img
        src="/illustrations/standing-15.svg"
        alt=""
        className="absolute bottom-24 right-10 w-48 opacity-15 pointer-events-none"
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-200">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 bg-white/80 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors group"
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
          <span className="text-sm font-medium">Back</span>
        </Link>

        {/* Title & status - centered */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <h1 className="text-sm font-semibold tracking-wide text-gray-900">
            Landly Assistant
          </h1>
          <p
            className={`mt-1.5 text-xs font-medium transition-colors duration-500 ${
              state === "idle"
                ? "text-gray-400"
                : state === "recording"
                  ? "text-blue-500"
                  : state === "processing"
                    ? "text-indigo-500"
                    : "text-emerald-500"
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
          <p className="text-sm font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-2 max-w-xs text-center">
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
