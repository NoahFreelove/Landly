from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship

from database import Base


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    level = Column(Integer, default=1)
    weekly_rent_credits = Column(Integer, default=100)
    monthly_rent_usd = Column(Float, default=1200.0)
    radiation_level = Column(Float, default=0.0)
    altitude = Column(Integer, default=0)
    smart_lock_status = Column(String, default="locked")  # locked, unlocked, override
    oxygen_quality = Column(Float, default=95.0)
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)

    residents = relationship("User", back_populates="unit")
    resource_metrics = relationship("ResourceMetric", back_populates="unit")
