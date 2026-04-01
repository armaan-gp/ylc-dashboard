from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class AppConfig(Base):
    __tablename__ = "app_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    theme_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#2563eb")
