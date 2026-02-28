// ---- User / Auth ----
export interface User {
  id: number;
  citizen_id: string;
  name: string;
  social_credit_score: number;
  trust_score: number;
  status: "compliant" | "warning" | "probation" | "eviction_pending";
  tier: "bronze" | "silver" | "gold" | "platinum";
  unit_id: number | null;
}

export interface LoginRequest {
  citizen_id: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ---- Units ----
export interface Unit {
  id: number;
  name: string;
  sector: string;
  level: number;
  weekly_rent_credits: number;
  monthly_rent_usd: number;
  radiation_level: number;
  altitude: number;
  smart_lock_status: "locked" | "unlocked" | "override";
  oxygen_quality: number;
  image_url?: string;
  is_available: boolean;
}

// ---- Payments ----
export interface Payment {
  id: number;
  user_id: number;
  amount: number;
  payment_type: "rent" | "late_fee" | "klarna" | "market_loss";
  status: "pending" | "paid" | "overdue" | "defaulted";
  due_date: string;
  interest_rate: number;
  accrued_interest: number;
}

export interface KlarnaDebt {
  id: number;
  user_id: number;
  item_name: string;
  total_amount: number;
  installments: number;
  installments_paid: number;
  status: "active" | "overdue" | "completed";
}

export interface EvictionStatus {
  is_pending: boolean;
  deadline: string | null;
  reason: string | null;
  amount_owed: number;
}

// ---- Markets ----
export interface Market {
  id: number;
  question: string;
  category: string;
  yes_price: number;
  no_price: number;
  volume: number;
  is_active: boolean;
}

export interface MarketBet {
  id: number;
  user_id: number;
  market_id: number;
  position: "yes" | "no";
  amount: number;
}

// ---- Chat ----
export interface ChatMessage {
  id: number;
  user_id: number;
  role: "user" | "assistant";
  content: string;
  negotiation_id: string | null;
  created_at: string;
}

// ---- Resources ----
export interface ResourceMetric {
  id: number;
  unit_id: number;
  metric_type: "oxygen" | "water" | "power" | "noise";
  current_value: number;
  max_value: number;
  status: "normal" | "warning" | "critical";
  trend: "up" | "down" | "stable";
}

// ---- Dashboard ----
export interface DashboardData {
  user: User;
  unit: Unit | null;
  resources: ResourceMetric[];
  recent_payments: Payment[];
  klarna_debts: KlarnaDebt[];
  markets: Market[];
  eviction_status: EvictionStatus;
}
