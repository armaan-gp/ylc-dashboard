from datetime import date
from typing import Optional
from sqlalchemy import Integer, String, Float, Date, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SessionLog(Base):
    __tablename__ = "session_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False, index=True)
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today, index=True)
    sets: Mapped[int] = mapped_column(Integer, nullable=False)
    reps: Mapped[int] = mapped_column(Integer, nullable=False)
    weight_lbs: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    @property
    def e1rm(self) -> float:
        return round(self.weight_lbs * (1 + self.reps / 30), 1)

    @property
    def volume(self) -> float:
        return round(self.sets * self.reps * self.weight_lbs, 1)

    member: Mapped["Member"] = relationship("Member", back_populates="session_logs")
    exercise: Mapped["Exercise"] = relationship("Exercise", back_populates="session_logs")
