from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    category = Column(String, nullable=False)
    yes_price = Column(Float, default=0.5)
    no_price = Column(Float, default=0.5)
    volume = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    bets = relationship("MarketBet", back_populates="market")


class MarketBet(Base):
    __tablename__ = "market_bets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    position = Column(String, nullable=False)  # yes, no
    amount = Column(Float, nullable=False)

    user = relationship("User", back_populates="market_bets")
    market = relationship("Market", back_populates="bets")
