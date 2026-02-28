from pydantic import BaseModel

class MarketResponse(BaseModel):
    id: int
    question: str
    category: str
    yes_price: float
    no_price: float
    volume: int
    is_active: bool

    class Config:
        from_attributes = True

class MarketBetRequest(BaseModel):
    position: str
    amount: float

class MarketBetResponse(BaseModel):
    id: int
    user_id: int
    market_id: int
    position: str
    amount: float

    class Config:
        from_attributes = True

class LeaderboardEntry(BaseModel):
    citizen_id: str
    name: str
    missed_payments: int
    social_credit_score: int
    eviction_odds: float
    total_owed: float
