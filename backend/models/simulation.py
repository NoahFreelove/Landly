from sqlalchemy import Column, Integer, Date
from database import Base
from datetime import date

class SimulationState(Base):
    __tablename__ = "simulation_state"

    id = Column(Integer, primary_key=True, default=1)
    current_date = Column(Date, default=date.today)
    day_number = Column(Integer, default=1)
