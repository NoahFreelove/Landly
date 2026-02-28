from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class TenantRating(Base):
    __tablename__ = "tenant_ratings"

    id = Column(Integer, primary_key=True, index=True)
    rater_id = Column(Integer, ForeignKey("users.id"))
    rated_id = Column(Integer, ForeignKey("users.id"))
    noise = Column(Float, default=3.0)       # 1-5
    cleanliness = Column(Float, default=3.0) # 1-5
    loyalty = Column(Float, default=3.0)     # 1-5
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    rater = relationship("User", foreign_keys=[rater_id], backref="ratings_given")
    rated = relationship("User", foreign_keys=[rated_id], backref="ratings_received")
