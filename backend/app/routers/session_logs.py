from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
import csv
import io

from app.database import get_db
from app.auth import get_current_user
from app.models.session_log import SessionLog
from app.models.member import Member
from app.models.exercise import Exercise
from app.schemas.session_log import SessionLogCreate, SessionLogUpdate, SessionLogRead

router = APIRouter(prefix="/api/logs", tags=["logs"])


def to_read(log: SessionLog) -> SessionLogRead:
    return SessionLogRead(
        id=log.id,
        member_id=log.member_id,
        exercise_id=log.exercise_id,
        date=log.date,
        sets=log.sets,
        reps=log.reps,
        weight_lbs=log.weight_lbs,
        duration_seconds=log.duration_seconds,
        notes=log.notes,
        e1rm=log.e1rm,
        volume=log.volume,
        member_name=log.member.name,
        exercise_name=log.exercise.name,
    )


@router.get("/recent", response_model=List[SessionLogRead])
def recent_logs(
    limit: int = 20,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    logs = (
        db.query(SessionLog)
        .order_by(desc(SessionLog.date), desc(SessionLog.id))
        .limit(limit)
        .all()
    )
    return [to_read(log) for log in logs]


@router.get("", response_model=List[SessionLogRead])
def list_logs(
    member_id: Optional[int] = None,
    exercise_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    query = db.query(SessionLog)
    if member_id:
        query = query.filter(SessionLog.member_id == member_id)
    if exercise_id:
        query = query.filter(SessionLog.exercise_id == exercise_id)
    if date_from:
        query = query.filter(SessionLog.date >= date_from)
    if date_to:
        query = query.filter(SessionLog.date <= date_to)
    query = query.order_by(desc(SessionLog.date), desc(SessionLog.id))
    if limit:
        query = query.limit(limit)
    logs = query.all()
    return [to_read(log) for log in logs]


@router.post("", response_model=List[SessionLogRead], status_code=status.HTTP_201_CREATED)
def bulk_upsert_logs(
    body: List[SessionLogCreate],
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    """Bulk upsert: update existing log if member+exercise+date exists, else insert."""
    result = []
    for item in body:
        log_date = item.date or date.today()

        # Validate member and exercise exist
        member = db.query(Member).filter(Member.id == item.member_id).first()
        if not member:
            raise HTTPException(status_code=404, detail=f"Member {item.member_id} not found")
        exercise = db.query(Exercise).filter(Exercise.id == item.exercise_id).first()
        if not exercise:
            raise HTTPException(status_code=404, detail=f"Exercise {item.exercise_id} not found")

        existing = (
            db.query(SessionLog)
            .filter(
                SessionLog.member_id == item.member_id,
                SessionLog.exercise_id == item.exercise_id,
                SessionLog.date == log_date,
            )
            .first()
        )
        if existing:
            existing.sets = item.sets
            existing.reps = item.reps
            existing.weight_lbs = item.weight_lbs
            existing.duration_seconds = item.duration_seconds
            if item.notes is not None:
                existing.notes = item.notes
            result.append(existing)
        else:
            log = SessionLog(
                member_id=item.member_id,
                exercise_id=item.exercise_id,
                date=log_date,
                sets=item.sets,
                reps=item.reps,
                weight_lbs=item.weight_lbs,
                duration_seconds=item.duration_seconds,
                notes=item.notes,
            )
            db.add(log)
            db.flush()
            result.append(log)

    db.commit()
    for log in result:
        db.refresh(log)
    return [to_read(log) for log in result]


@router.patch("/{log_id}", response_model=SessionLogRead)
def update_log(
    log_id: int,
    body: SessionLogUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    log = db.query(SessionLog).filter(SessionLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    return to_read(log)


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    log = db.query(SessionLog).filter(SessionLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
