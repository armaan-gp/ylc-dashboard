from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.auth import get_current_user
from app.models.member import Member
from app.models.session_log import SessionLog
from app.models.exercise import Exercise
from app.schemas.member import MemberCreate, MemberUpdate, MemberRead, MemberExerciseLastLog

router = APIRouter(prefix="/api/members", tags=["members"])


def enrich_member(member: Member, db: Session) -> MemberRead:
    last_log = (
        db.query(SessionLog)
        .filter(SessionLog.member_id == member.id)
        .order_by(desc(SessionLog.date))
        .first()
    )
    count = db.query(func.count(SessionLog.id)).filter(SessionLog.member_id == member.id).scalar()
    return MemberRead(
        id=member.id,
        name=member.name,
        join_date=member.join_date,
        active=member.active,
        notes=member.notes,
        last_session=last_log.date if last_log else None,
        session_count=count or 0,
    )


@router.get("", response_model=List[MemberRead])
def list_members(
    active_only: bool = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    query = db.query(Member)
    if active_only:
        query = query.filter(Member.active == True)
    if search:
        query = query.filter(Member.name.ilike(f"%{search}%"))
    members = query.order_by(Member.name).all()
    return [enrich_member(m, db) for m in members]


@router.post("", response_model=List[MemberRead], status_code=status.HTTP_201_CREATED)
def create_members(
    body: List[MemberCreate],
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    created = []
    for item in body:
        member = Member(
            name=item.name,
            join_date=item.join_date or date.today(),
            active=item.active,
            notes=item.notes,
        )
        db.add(member)
        db.flush()
        created.append(member)
    db.commit()
    return [enrich_member(m, db) for m in created]


@router.get("/{member_id}", response_model=MemberRead)
def get_member(
    member_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return enrich_member(member, db)


@router.patch("/{member_id}", response_model=MemberRead)
def update_member(
    member_id: int,
    body: MemberUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return enrich_member(member, db)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_member(
    member_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    member.active = False
    db.commit()


@router.get("/{member_id}/exercises", response_model=List[MemberExerciseLastLog])
def get_member_exercises(
    member_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    """Returns all exercises a member has logged, with their last logged values for Quick-Log prefill."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Get distinct exercise IDs for this member
    exercise_ids = (
        db.query(SessionLog.exercise_id)
        .filter(SessionLog.member_id == member_id)
        .distinct()
        .all()
    )
    exercise_ids = [r[0] for r in exercise_ids]

    result = []
    for ex_id in exercise_ids:
        exercise = db.query(Exercise).filter(Exercise.id == ex_id, Exercise.active == True).first()
        if not exercise:
            continue
        last_log = (
            db.query(SessionLog)
            .filter(SessionLog.member_id == member_id, SessionLog.exercise_id == ex_id)
            .order_by(desc(SessionLog.date), desc(SessionLog.id))
            .first()
        )
        result.append(
            MemberExerciseLastLog(
                exercise_id=ex_id,
                exercise_name=exercise.name,
                category=exercise.category.value,
                last_sets=last_log.sets if last_log else None,
                last_reps=last_log.reps if last_log else None,
                last_weight_lbs=last_log.weight_lbs if last_log else None,
                last_date=last_log.date if last_log else None,
                last_e1rm=last_log.e1rm if last_log else None,
            )
        )
    result.sort(key=lambda x: x.exercise_name)
    return result
