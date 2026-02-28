"use client";

import { useRef, useState, useCallback, useEffect } from "react";

type VoiceState = "idle" | "recording" | "processing" | "playing";

interface PushToTalkProps {
  onRecordingComplete: (blob: Blob) => void;
  onRecordingStart?: () => void;
  isDisabled: boolean;
  state: VoiceState;
}

export default function PushToTalk({
  onRecordingComplete,
  onRecordingStart,
  isDisabled,
  state,
}: PushToTalkProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (isDisabled || isRecordingRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        // Stop all tracks to release the microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (blob.size > 0) {
          onRecordingComplete(blob);
        }
      };

      mediaRecorder.start();
      isRecordingRef.current = true;
      setDuration(0);
      onRecordingStart?.();

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [isDisabled, onRecordingComplete, onRecordingStart]);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;

    isRecordingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isActive = state === "recording";
  const disabled = isDisabled || state === "processing" || state === "playing";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Push-to-talk button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={(e) => {
          e.preventDefault();
          startRecording();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopRecording();
        }}
        disabled={disabled}
        className={`
          relative w-20 h-20 rounded-full border-2 transition-all duration-300
          flex items-center justify-center select-none touch-none
          ${
            disabled
              ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-40"
              : isActive
                ? "border-accent-red bg-accent-red/20 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-[btn-pulse_0.8s_ease-in-out_infinite] scale-110"
                : "border-blue-300 bg-white hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] active:scale-95 cursor-pointer"
          }
        `}
        aria-label={isActive ? "Release to stop recording" : "Hold to speak"}
      >
        {/* Microphone icon */}
        <span
          className={`text-2xl transition-colors duration-300 ${
            disabled
              ? "text-gray-400"
              : isActive
                ? "text-accent-red"
                : "text-gray-500"
          }`}
        >
          {disabled ? (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .51-.06 1-.16 1.47" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </span>

        {/* Recording pulse ring */}
        {isActive && (
          <span className="absolute inset-0 rounded-full border-2 border-accent-red/50 animate-ping" />
        )}
      </button>

      {/* Label */}
      <span className="label-tracked text-center">
        {isActive ? (
          <span className="text-accent-red">
            RECORDING... {formatDuration(duration)}
          </span>
        ) : disabled ? (
          <span className="text-gray-400">
            {state === "processing" ? "PROCESSING..." : "SPEAKING..."}
          </span>
        ) : (
          <span className="text-gray-500">HOLD TO SPEAK</span>
        )}
      </span>

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes btn-pulse {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
          }
          50% {
            box-shadow: 0 0 40px rgba(239, 68, 68, 0.4);
          }
        }
      `}</style>
    </div>
  );
}
