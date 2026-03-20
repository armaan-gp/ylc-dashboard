from __future__ import annotations
import enum
from typing import Optional, List
from sqlalchemy import Integer, String, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class CategoryEnum(str, enum.Enum):
    Push = "Push"
    Pull = "Pull"
    Legs = "Legs"
    Core = "Core"
    Cardio = "Cardio"
    Other = "Other"


class TrackingTypeEnum(str, enum.Enum):
    weight_reps = "weight_reps"
    weight_duration = "weight_duration"


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    category: Mapped[CategoryEnum] = mapped_column(
        Enum(CategoryEnum), nullable=False, default=CategoryEnum.Other
    )
    tracking_type: Mapped[TrackingTypeEnum] = mapped_column(
        Enum(TrackingTypeEnum), nullable=False, default=TrackingTypeEnum.weight_reps
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Integer, default=True)

    session_logs: Mapped[List["SessionLog"]] = relationship(
        "SessionLog", back_populates="exercise"
    )
