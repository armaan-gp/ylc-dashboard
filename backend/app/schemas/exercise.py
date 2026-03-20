from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.exercise import CategoryEnum, TrackingTypeEnum


class ExerciseBase(BaseModel):
    name: str
    category: CategoryEnum = CategoryEnum.Other
    tracking_type: TrackingTypeEnum = TrackingTypeEnum.weight_reps
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[CategoryEnum] = None
    tracking_type: Optional[TrackingTypeEnum] = None
    description: Optional[str] = None
    active: Optional[bool] = None


class ExerciseRead(BaseModel):
    id: int
    name: str
    category: CategoryEnum
    tracking_type: TrackingTypeEnum
    description: Optional[str]
    active: bool
    usage_count: int = 0

    model_config = {"from_attributes": True}
