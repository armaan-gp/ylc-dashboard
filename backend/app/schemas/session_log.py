from datetime import date
from typing import Optional, List
from pydantic import BaseModel, field_validator


class SessionLogBase(BaseModel):
    member_id: int
    exercise_id: int
    date: Optional[date] = None
    sets: int
    reps: int
    weight_lbs: float
    duration_seconds: Optional[float] = None
    notes: Optional[str] = None

    @field_validator("sets", "reps")
    @classmethod
    def positive_int(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Must be positive")
        return v

    @field_validator("weight_lbs")
    @classmethod
    def non_negative_float(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Weight must be non-negative")
        return v


class SessionLogCreate(SessionLogBase):
    pass


class SessionLogUpdate(BaseModel):
    date: Optional[date] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight_lbs: Optional[float] = None
    duration_seconds: Optional[float] = None
    notes: Optional[str] = None


class SessionLogRead(BaseModel):
    id: int
    member_id: int
    exercise_id: int
    date: date
    sets: int
    reps: int
    weight_lbs: float
    duration_seconds: Optional[float]
    notes: Optional[str]
    e1rm: float
    volume: float
    member_name: str
    exercise_name: str

    model_config = {"from_attributes": True}
