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
      setError(err.message || "Authentication failed. Compliance violation logged.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputOverrides = {
    Root: {
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
        borderTopLeftRadius: '0.5rem',
        borderTopRightRadius: '0.5rem',
        borderBottomLeftRadius: '0.5rem',
        borderBottomRightRadius: '0.5rem',
      },
    },
    Input: {
      style: {
        color: '#e4e4e7',
        backgroundColor: '#131022',
        fontSize: '0.875rem',
        '::placeholder': { color: '#52525b' },
      },
    },
    InputContainer: {
      style: {
        backgroundColor: '#131022',
      },
    },
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
              <Input
                id="citizen_id"
                type="text"
                value={citizenId}
                onChange={(e) => setCitizenId((e.target as HTMLInputElement).value)}
                required
                autoComplete="username"
                placeholder="CZ-XXXX"
                overrides={inputOverrides}
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
              <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-4 py-2.5 text-xs text-accent-red">
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
                    backgroundColor: '#3211d4',
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
                      backgroundColor: '#2a0eb3',
                    },
                    ':disabled': {
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    },
                  },
                },
              }}
            >
              {isSubmitting ? "Verifying..." : "Authenticate"}
            </Button>
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
