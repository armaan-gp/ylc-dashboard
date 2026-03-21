from datetime import date
from typing import Optional, List
from pydantic import BaseModel, field_validator


class MemberBase(BaseModel):
    name: str
    join_date: Optional[date] = None
    active: bool = True
    notes: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class MemberCreate(MemberBase):
    join_date: Optional[date] = None


class MemberUpdate(BaseModel):
    name: Optional[str] = None
    join_date: Optional[date] = None
    active: Optional[bool] = None
    notes: Optional[str] = None


class MemberRead(BaseModel):
    id: int
    name: str
    join_date: date
    active: bool
    notes: Optional[str]
    last_session: Optional[date] = None

    model_config = {"from_attributes": True}


class MemberExerciseLastLog(BaseModel):
    exercise_id: int
    exercise_name: str
    category: str
    tracking_type: str = "weight_reps"
    last_sets: Optional[int] = None
    last_reps: Optional[int] = None
    last_weight_lbs: Optional[float] = None
    last_duration_seconds: Optional[float] = None
    last_date: Optional[date] = None
    last_e1rm: Optional[float] = None
