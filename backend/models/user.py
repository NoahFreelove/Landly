from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    social_credit_score = Column(Integer, default=500)
    trust_score = Column(Float, default=0.5)
    status = Column(String, default="compliant")  # compliant, warning, probation, eviction_pending
    tier = Column(String, default="bronze")  # bronze, silver, gold, platinum
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    default_plan_type = Column(String, default="flexible")  # standard, flexible, freedom
    autopay_enabled = Column(Integer, default=0)  # 0=off, 1=on
    landly_points = Column(Integer, default=1000)
    referred_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    referral_code = Column(String, unique=True, nullable=True)

    unit = relationship("Unit", back_populates="residents")
    payments = relationship("Payment", back_populates="user")
    klarna_debts = relationship("KlarnaDebt", back_populates="user")
    market_bets = relationship("MarketBet", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")
