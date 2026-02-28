"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const [citizenId, setCitizenId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect
  if (isAuthenticated) {
    router.replace("/dashboard");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(citizenId, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Compliance violation logged.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary-light">LAND</span>LY
          </h1>
          <p className="label-tracked text-zinc-500">
            Citizen Housing Management Portal
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-xl border border-[#2b2839] bg-surface-card p-8 shadow-lg shadow-black/20">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
            Citizen Authentication
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Citizen ID */}
            <div className="space-y-1.5">
              <label
                htmlFor="citizen_id"
                className="label-tracked text-[10px] text-zinc-500"
              >
                Citizen ID
              </label>
              <input
                id="citizen_id"
                type="text"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
                required
                autoComplete="username"
                placeholder="CZ-XXXX"
                className="block w-full rounded-lg border border-[#2b2839] bg-surface-page px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="label-tracked text-[10px] text-zinc-500"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                className="block w-full rounded-lg border border-[#2b2839] bg-surface-page px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-4 py-2.5 text-xs text-accent-red">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Verifying...
                </span>
              ) : (
                "Authenticate"
              )}
            </button>
          </form>
        </div>

        {/* Tagline */}
        <p className="text-center text-xs text-zinc-600 tracking-wide">
          Compliance is comfort.
        </p>
      </div>
    </main>
  );
}
