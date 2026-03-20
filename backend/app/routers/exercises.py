from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth import get_current_user
from app.models.exercise import Exercise
from app.models.session_log import SessionLog
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate, ExerciseRead

router = APIRouter(prefix="/api/exercises", tags=["exercises"])


def enrich_exercise(exercise: Exercise, db: Session) -> ExerciseRead:
    count = (
        db.query(func.count(SessionLog.id))
        .filter(SessionLog.exercise_id == exercise.id)
        .scalar()
    )
    return ExerciseRead(
        id=exercise.id,
        name=exercise.name,
        category=exercise.category,
        tracking_type=exercise.tracking_type,
        description=exercise.description,
        active=bool(exercise.active),
        usage_count=count or 0,
    )


@router.get("", response_model=List[ExerciseRead])
def list_exercises(
    category: Optional[str] = None,
    search: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    query = db.query(Exercise)
    if active_only:
        query = query.filter(Exercise.active == True)
    if category:
        query = query.filter(Exercise.category == category)
    if search:
        query = query.filter(Exercise.name.ilike(f"%{search}%"))
    exercises = query.order_by(Exercise.name).all()
    return [enrich_exercise(e, db) for e in exercises]


@router.post("", response_model=ExerciseRead, status_code=status.HTTP_201_CREATED)
def create_exercise(
    body: ExerciseCreate,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    existing = db.query(Exercise).filter(Exercise.name.ilike(body.name)).first()
    if existing:
        # Return existing exercise (idempotent creation from Quick-Log)
        return enrich_exercise(existing, db)
    exercise = Exercise(
        name=body.name,
        category=body.category,
        tracking_type=body.tracking_type,
        description=body.description,
        active=True,
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return enrich_exercise(exercise, db)


@router.patch("/{exercise_id}", response_model=ExerciseRead)
def update_exercise(
    exercise_id: int,
    body: ExerciseUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(exercise, field, value)
    db.commit()
    db.refresh(exercise)
    return enrich_exercise(exercise, db)


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    log_count = (
        db.query(func.count(SessionLog.id))
        .filter(SessionLog.exercise_id == exercise_id)
        .scalar()
    )
    if log_count and log_count > 0:
        # Soft delete instead of hard delete when logs exist
        exercise.active = False
        db.commit()
    else:
        db.delete(exercise)
        db.commit()
