from __future__ import annotations
from datetime import date
from typing import Optional, List
from sqlalchemy import Integer, String, Boolean, Date, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Member(Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    join_date: Mapped[date] = mapped_column(Date, default=date.today)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    session_logs: Mapped[List["SessionLog"]] = relationship(
        "SessionLog", back_populates="member", cascade="all, delete-orphan"
    )
