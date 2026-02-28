from pydantic import BaseModel
from datetime import date

class SimulationStateResponse(BaseModel):
    current_date: date
    day_number: int

class AdvanceTimeResponse(BaseModel):
    previous_date: date
    new_date: date
    events: list[str]
