import type { AuthResponse, DashboardData, Unit, User } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function api<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

export function apiStream(
  endpoint: string,
  body: Record<string, unknown>,
  token?: string
): EventSource | ReadableStream {
  const url = `${API_BASE}${endpoint}`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).then((res) => {
    if (!res.body) throw new Error("No response body");
    return res.body;
  }) as unknown as ReadableStream;
}

// ---- Auth ----
export async function login(citizen_id: string, password: string) {
  return api<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ citizen_id, password }),
  });
}

export async function getMe(token: string) {
  return api<User>("/api/auth/me", { token });
}

// ---- Dashboard ----
export async function getDashboard(token: string) {
  return api<DashboardData>("/api/dashboard", { token });
}

// ---- Units ----
export async function getUnits(token: string) {
  return api<Unit[]>("/api/units", { token });
}

export async function getUnit(token: string, id: number) {
  return api<Unit>(`/api/units/${id}`, { token });
}

export async function applyForUnit(
  token: string,
  id: number,
  klarna_installments: number
) {
  return api<any>(`/api/units/${id}/apply`, {
    method: "POST",
    body: JSON.stringify({ klarna_installments }),
    token,
  });
}

// ---- Payments ----
export async function getPaymentSummary(token: string) {
  return api<any>("/api/payments/summary", { token });
}

export async function makePayment(
  token: string,
  payment_id: number,
  amount: number
) {
  return api<any>("/api/payments/pay", {
    method: "POST",
    body: JSON.stringify({ payment_id, amount }),
    token,
  });
}

export async function getEvictionStatus(token: string) {
  return api<any>("/api/payments/eviction-status", { token });
}

// ---- Markets ----
export async function getMarkets(token: string) {
  return api<any[]>("/api/markets", { token });
}

export async function placeBet(
  token: string,
  marketId: number,
  position: string,
  amount: number
) {
  return api<any>(`/api/markets/${marketId}/bet`, {
    method: "POST",
    body: JSON.stringify({ position, amount }),
    token,
  });
}

export async function getLeaderboard(token: string) {
  return api<any[]>("/api/markets/leaderboard", { token });
}

// ---- Notifications ----
export async function getNotifications(token: string) {
  return api<any[]>("/api/notifications", { token });
}

// ---- Admin / Simulation ----
export async function getCurrentDate(token: string) {
  return api<any>("/api/admin/current-date", { token });
}

export async function advanceDay(token: string) {
  return api<any>("/api/admin/advance-day", { method: "POST", token });
}

export async function advanceMonth(token: string) {
  return api<any>("/api/admin/advance-month", { method: "POST", token });
}
