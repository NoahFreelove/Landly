from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    citizen_id: str
    password: str

class UserResponse(BaseModel):
    id: int
    citizen_id: str
    name: str
    social_credit_score: int
    trust_score: float
    status: str
    tier: str
    unit_id: Optional[int] = None
    token_balance: float = 1000.0
    default_plan_type: str = "flexible"
    autopay_enabled: bool = False
    landly_points: int = 0
    referral_code: Optional[str] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ReferralRequest(BaseModel):
    referral_code: str
