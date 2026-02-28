from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class ResourceMetric(Base):
    __tablename__ = "resource_metrics"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    metric_type = Column(String, nullable=False)  # oxygen, water, power, noise
    current_value = Column(Float, nullable=False)
    max_value = Column(Float, nullable=False)
    status = Column(String, default="normal")  # normal, warning, critical
    trend = Column(String, default="stable")  # up, down, stable

    unit = relationship("Unit", back_populates="resource_metrics")
