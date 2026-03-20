from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.auth import get_current_user
from app.models.session_log import SessionLog
from app.models.member import Member
from app.models.exercise import Exercise
from app.schemas.analytics import (
    ClubStats,
    E1RMDataPoint,
    VolumeDataPoint,
    ProjectionResult,
    PlateauResult,
    Recommendation,
    NeedsAttentionMember,
    WeeklyVolume,
    TopPerformer,
)
from app.services.analytics import (
    get_member_e1rm_series,
    get_member_volume_series,
    get_projections_for_member,
    get_plateaus_for_member,
    get_needs_attention,
    get_club_weekly_volume,
)
from app.services.recommendations import get_recommendations_for_member

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/club-stats", response_model=ClubStats)
def club_stats(
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    total = db.query(func.count(Member.id)).scalar() or 0
    active = db.query(func.count(Member.id)).filter(Member.active == True).scalar() or 0
    sessions_week = (
        db.query(func.count(SessionLog.id))
        .filter(SessionLog.date >= week_start)
        .scalar() or 0
    )
    sessions_month = (
        db.query(func.count(SessionLog.id))
        .filter(SessionLog.date >= month_start)
        .scalar() or 0
    )
    total_sessions = db.query(func.count(SessionLog.id)).scalar() or 0

    # Most active member
    most_active = (
        db.query(Member.name, func.count(SessionLog.id).label("cnt"))
        .join(SessionLog, SessionLog.member_id == Member.id)
        .group_by(Member.id)
        .order_by(desc("cnt"))
        .first()
    )

    # Top exercise
    top_exercise = (
        db.query(Exercise.name, func.count(SessionLog.id).label("cnt"))
        .join(SessionLog, SessionLog.exercise_id == Exercise.id)
        .group_by(Exercise.id)
        .order_by(desc("cnt"))
        .first()
    )

    return ClubStats(
        total_members=total,
        active_members=active,
        sessions_this_week=sessions_week,
        sessions_this_month=sessions_month,
        most_active_member_name=most_active[0] if most_active else None,
        top_exercise_name=top_exercise[0] if top_exercise else None,
        total_sessions=total_sessions,
    )


@router.get("/member/{member_id}/e1rm", response_model=List[E1RMDataPoint])
def member_e1rm(
    member_id: int,
    exercise_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    series = get_member_e1rm_series(member_id, db)
    if exercise_id is not None:
        return series.get(exercise_id, [])

    # Return all exercises flattened
    result = []
    for points in series.values():
        result.extend(points)
    return sorted(result, key=lambda x: x.date)


@router.get("/member/{member_id}/volume", response_model=List[VolumeDataPoint])
def member_volume(
    member_id: int,
    exercise_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    series = get_member_volume_series(member_id, db)
    if exercise_id is not None:
        return series.get(exercise_id, [])

    result = []
    for points in series.values():
        result.extend(points)
    return sorted(result, key=lambda x: x.date)


@router.get("/member/{member_id}/projection", response_model=List[ProjectionResult])
def member_projection(
    member_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return get_projections_for_member(member_id, db)


@router.get("/member/{member_id}/plateau", response_model=List[PlateauResult])
def member_plateau(
    member_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return get_plateaus_for_member(member_id, db)


@router.get("/member/{member_id}/recommendations", response_model=List[Recommendation])
def member_recommendations(
    member_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return get_recommendations_for_member(member_id, db)


@router.get("/needs-attention", response_model=List[NeedsAttentionMember])
def needs_attention(
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    return get_needs_attention(db)


@router.get("/club-volume", response_model=List[WeeklyVolume])
def club_volume(
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    return get_club_weekly_volume(db)


@router.get("/top-performers", response_model=List[TopPerformer])
def top_performers(
    db: Session = Depends(get_db),
    _: bool = Depends(get_current_user),
):
    """Members with highest % e1RM gain this month."""
    today = date.today()
    month_start = today.replace(day=1)

    members = db.query(Member).filter(Member.active == True).all()
    performers = []

    for member in members:
        from app.services.analytics import get_member_e1rm_series
        series = get_member_e1rm_series(member.id, db)
        for ex_id, points in series.items():
            if len(points) < 2:
                continue
            # Find first point at or after month_start
            before = [p for p in points if p.date < month_start]
            after = [p for p in points if p.date >= month_start]
            if not before or not after:
                continue
            baseline = before[-1].e1rm
            current = after[-1].e1rm
            if baseline > 0:
                gain_pct = round((current - baseline) / baseline * 100, 1)
                if gain_pct > 0:
                    performers.append(
                        TopPerformer(
                            member_id=member.id,
                            member_name=member.name,
                            exercise_name=after[-1].exercise_name,
                            e1rm_gain_pct=gain_pct,
                            current_e1rm=current,
                        )
                    )

    performers.sort(key=lambda x: x.e1rm_gain_pct, reverse=True)
    return performers[:10]
