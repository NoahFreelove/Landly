from pydantic import BaseModel
from typing import Optional


class UnitResponse(BaseModel):
    id: int
    name: str
    sector: str
    monthly_rent_usd: float
    sqft: int
    bedrooms: int
    bathrooms: int
    floor: int
    pet_policy: str
    parking: str
    laundry: str
    year_built: int
    smart_home: bool
    noise_monitoring: bool
    community_score_required: int
    image_url: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True


class UnitApplyRequest(BaseModel):
    klarna_installments: int = 4
