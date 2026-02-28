from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_type = Column(String, nullable=False)  # rent, late_fee, klarna, market_loss
    status = Column(String, default="pending")  # pending, paid, overdue, defaulted
    due_date = Column(DateTime, nullable=False)
    interest_rate = Column(Float, default=0.0)
    accrued_interest = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="payments")


class KlarnaDebt(Base):
    __tablename__ = "klarna_debts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_name = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    installments = Column(Integer, default=4)
    installments_paid = Column(Integer, default=0)
    status = Column(String, default="active")  # active, overdue, completed

    user = relationship("User", back_populates="klarna_debts")
