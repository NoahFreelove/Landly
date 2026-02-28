from pydantic import BaseModel
from typing import Optional

class UnitResponse(BaseModel):
    id: int
    name: str
    sector: str
    level: int
    weekly_rent_credits: int
    monthly_rent_usd: float
    radiation_level: float
    altitude: int
    smart_lock_status: str
    oxygen_quality: float
    image_url: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True

class UnitApplyRequest(BaseModel):
    klarna_installments: int = 4
