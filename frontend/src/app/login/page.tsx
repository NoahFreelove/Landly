"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, SIZE as BUTTON_SIZE } from "baseui/button";
import { Input } from "baseui/input";

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
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputOverrides = {
    Root: {
      style: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e5e7eb',
        borderRightColor: '#e5e7eb',
        borderBottomColor: '#e5e7eb',
        borderLeftColor: '#e5e7eb',
        borderTopWidth: '1px',
        borderRightWidth: '1px',
        borderBottomWidth: '1px',
        borderLeftWidth: '1px',
        borderTopStyle: 'solid' as const,
        borderRightStyle: 'solid' as const,
        borderBottomStyle: 'solid' as const,
        borderLeftStyle: 'solid' as const,
        borderTopLeftRadius: '0.5rem',
        borderTopRightRadius: '0.5rem',
        borderBottomLeftRadius: '0.5rem',
        borderBottomRightRadius: '0.5rem',
      },
    },
    Input: {
      style: {
        color: '#111827',
        backgroundColor: '#ffffff',
        fontSize: '0.875rem',
        '::placeholder': { color: '#9ca3af' },
      },
    },
    InputContainer: {
      style: {
        backgroundColor: '#ffffff',
      },
    },
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-blue-500">LAND</span>
            <span className="text-gray-900">LY</span>
          </h1>
          <p className="label-tracked text-gray-500">
            Modern Living, Simplified
          </p>
        </div>

        {/* Humaaan illustration */}
        <img src="/illustrations/standing-1.svg" alt="" className="w-40 mx-auto mb-6 opacity-80" />

        {/* Login card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Resident Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Resident ID */}
            <div className="space-y-1.5">
              <label
                htmlFor="citizen_id"
                className="label-tracked text-[10px] text-gray-500"
              >
                Resident ID
              </label>
              <Input
                id="citizen_id"
                type="text"
                value={citizenId}
                onChange={(e) => setCitizenId((e.target as HTMLInputElement).value)}
                required
                autoComplete="username"
                placeholder="RES-XXXX"
                overrides={inputOverrides}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="label-tracked text-[10px] text-gray-500"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                required
                autoComplete="current-password"
                placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                overrides={inputOverrides}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              overrides={{
                BaseButton: {
                  style: {
                    width: '100%',
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    borderTopLeftRadius: '0.5rem',
                    borderTopRightRadius: '0.5rem',
                    borderBottomLeftRadius: '0.5rem',
                    borderBottomRightRadius: '0.5rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    ':hover': {
                      backgroundColor: '#2563EB',
                    },
                    ':disabled': {
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    },
                  },
                },
              }}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        {/* Tagline */}
        <p className="text-center text-xs text-gray-400 tracking-wide">
          Modern Living, Simplified.
        </p>
      </div>
    </main>
  );
}
