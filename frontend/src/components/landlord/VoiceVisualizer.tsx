"use client";

type VoiceState = "idle" | "recording" | "processing" | "playing";

interface VoiceVisualizerProps {
  state: VoiceState;
}

export default function VoiceVisualizer({ state }: VoiceVisualizerProps) {
  return (
    <div className="relative flex items-center justify-center w-[280px] h-[280px]">
      {/* Outermost ring */}
      <div
        className={`absolute rounded-full transition-all duration-700 ${
          state === "idle"
            ? "w-[260px] h-[260px] border border-primary/10"
            : state === "recording"
              ? "w-[270px] h-[270px] border border-accent-red/20 animate-[ring-pulse_1s_ease-in-out_infinite]"
              : state === "processing"
                ? "w-[260px] h-[260px] border border-primary/20 animate-[spin_4s_linear_infinite]"
                : "w-[265px] h-[265px] border border-accent-green/20 animate-[ring-pulse_0.8s_ease-in-out_infinite]"
        }`}
        style={{
          borderStyle: state === "processing" ? "dashed" : "solid",
        }}
      />

      {/* Middle ring */}
      <div
        className={`absolute rounded-full transition-all duration-500 ${
          state === "idle"
            ? "w-[230px] h-[230px] border border-primary/15"
            : state === "recording"
              ? "w-[240px] h-[240px] border-2 border-accent-red/30 animate-[ring-pulse_0.8s_ease-in-out_infinite_0.1s]"
              : state === "processing"
                ? "w-[230px] h-[230px] border border-primary-light/20 animate-[spin_3s_linear_infinite_reverse]"
                : "w-[235px] h-[235px] border border-accent-green/25 animate-[ring-pulse_0.7s_ease-in-out_infinite_0.15s]"
        }`}
        style={{
          borderStyle: state === "processing" ? "dashed" : "solid",
        }}
      />

      {/* Inner ring */}
      <div
        className={`absolute rounded-full transition-all duration-500 ${
          state === "idle"
            ? "w-[210px] h-[210px] border border-primary/10"
            : state === "recording"
              ? "w-[215px] h-[215px] border border-accent-red/15 animate-[ring-pulse_1.2s_ease-in-out_infinite_0.2s]"
              : state === "processing"
                ? "w-[210px] h-[210px] border border-primary/15 animate-[spin_5s_linear_infinite]"
                : "w-[212px] h-[212px] border border-accent-green/15 animate-[ring-pulse_0.9s_ease-in-out_infinite_0.3s]"
        }`}
        style={{
          borderStyle: state === "processing" ? "dotted" : "solid",
        }}
      />

      {/* Core orb — glow layer */}
      <div
        className={`absolute rounded-full transition-all duration-700 blur-xl ${
          state === "idle"
            ? "w-[120px] h-[120px] bg-primary/20 animate-pulse-slow"
            : state === "recording"
              ? "w-[140px] h-[140px] bg-accent-red/25 animate-[core-pulse_0.6s_ease-in-out_infinite]"
              : state === "processing"
                ? "w-[130px] h-[130px] bg-primary-light/20 animate-[core-pulse_1s_ease-in-out_infinite]"
                : "w-[135px] h-[135px] bg-accent-green/20 animate-[speak-pulse_0.4s_ease-in-out_infinite]"
        }`}
      />

      {/* Core orb — solid center */}
      <div
        className={`absolute rounded-full transition-all duration-500 ${
          state === "idle"
            ? "w-[100px] h-[100px] bg-gradient-to-br from-primary-dark/60 to-primary/40 shadow-[0_0_30px_rgba(50,17,212,0.2)] animate-pulse-slow"
            : state === "recording"
              ? "w-[110px] h-[110px] bg-gradient-to-br from-red-900/70 to-accent-red/50 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-[core-pulse_0.6s_ease-in-out_infinite]"
              : state === "processing"
                ? "w-[100px] h-[100px] bg-gradient-to-br from-primary-dark/60 to-primary-light/40 shadow-[0_0_35px_rgba(88,53,245,0.3)] animate-[spin_2s_linear_infinite]"
                : "w-[105px] h-[105px] bg-gradient-to-br from-emerald-900/60 to-accent-green/30 shadow-[0_0_40px_rgba(0,204,102,0.25)] animate-[speak-pulse_0.4s_ease-in-out_infinite]"
        }`}
      />

      {/* Inner core highlight */}
      <div
        className={`absolute rounded-full transition-all duration-500 ${
          state === "idle"
            ? "w-[40px] h-[40px] bg-primary/30"
            : state === "recording"
              ? "w-[45px] h-[45px] bg-accent-red/40"
              : state === "processing"
                ? "w-[40px] h-[40px] bg-primary-light/30 animate-[spin_1.5s_linear_infinite_reverse]"
                : "w-[42px] h-[42px] bg-accent-green/35"
        }`}
      />

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes ring-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        @keyframes core-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes speak-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
