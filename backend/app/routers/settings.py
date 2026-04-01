from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.app_config import AppConfig

router = APIRouter(prefix="/api/settings", tags=["settings"])


class ThemeResponse(BaseModel):
    color: str


class ThemeUpdate(BaseModel):
    color: str = Field(..., pattern=r"^#[0-9a-fA-F]{6}$")


@router.get("/theme", response_model=ThemeResponse)
def get_theme(db: Session = Depends(get_db)):
    """Public — returns the current theme color. No auth required."""
    config = db.get(AppConfig, 1)
    return ThemeResponse(color=config.theme_color if config else "#2563eb")


@router.put("/theme", response_model=ThemeResponse)
def save_theme(
    body: ThemeUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    config = db.get(AppConfig, 1)
    if config is None:
        config = AppConfig(id=1, theme_color=body.color)
        db.add(config)
    else:
        config.theme_color = body.color
    db.commit()
    db.refresh(config)
    return ThemeResponse(color=config.theme_color)
