from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PaymentResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    payment_type: str
    status: str
    due_date: datetime
    interest_rate: float
    accrued_interest: float
    created_at: datetime

    class Config:
        from_attributes = True

class KlarnaDebtResponse(BaseModel):
    id: int
    user_id: int
    item_name: str
    total_amount: float
    installments: int
    installments_paid: int
    status: str

    class Config:
        from_attributes = True

class PaymentRequest(BaseModel):
    payment_id: int
    amount: float

class PaymentSummaryResponse(BaseModel):
    total_owed: float
    next_due_date: Optional[datetime] = None
    overdue_count: int
    payments: list[PaymentResponse]
    klarna_debts: list[KlarnaDebtResponse]

class EvictionStatusResponse(BaseModel):
    is_pending: bool
    deadline: Optional[str] = None
    reason: Optional[str] = None
    amount_owed: float
