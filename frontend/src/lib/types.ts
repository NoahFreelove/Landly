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
  token_balance: number;
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
  monthly_rent_usd: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  pet_policy: string;
  parking: string;
  laundry: string;
  year_built: number;
  smart_home: boolean;
  noise_monitoring: boolean;
  community_score_required: number;
  image_url: string | null;
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

export interface DebtBreakdown {
  rent: number;
  late_fees: number;
  klarna: number;
  interest: number;
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

// ---- Notifications ----
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

// ---- Dashboard ----
export interface DashboardData {
  user: User;
  unit: Unit | null;
  recent_payments: Payment[];
  klarna_debts: KlarnaDebt[];
  markets: Market[];
  notifications: Notification[];
  eviction_status: EvictionStatus;
  total_debt: number;
  debt_breakdown: DebtBreakdown;
  gentrification_index: number;
  credit_score: number;
  interest_rate: number;
}

// Tier display names
export const TIER_LABELS: Record<string, string> = {
  bronze: "Standard",
  silver: "Plus",
  gold: "Premium",
  platinum: "Elite",
};
