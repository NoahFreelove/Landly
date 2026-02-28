from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship

from database import Base


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    monthly_rent_usd = Column(Float, default=1200.0)
    sqft = Column(Integer, default=500)
    bedrooms = Column(Integer, default=1)
    bathrooms = Column(Integer, default=1)
    floor = Column(Integer, default=1)
    pet_policy = Column(String, default="No Pets")
    parking = Column(String, default="None")
    laundry = Column(String, default="Shared")
    year_built = Column(Integer, default=2018)
    smart_home = Column(Boolean, default=True)
    noise_monitoring = Column(Boolean, default=True)
    community_score_required = Column(Integer, default=600)
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)

    residents = relationship("User", back_populates="unit")
