from datetime import date, timedelta
from typing import List, Dict
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.session_log import SessionLog
from app.models.exercise import Exercise
from app.models.member import Member
from app.models.member_archived_exercise import MemberArchivedExercise
from app.schemas.analytics import (
    E1RMDataPoint,
    VolumeDataPoint,
    ProjectionResult,
    PlateauResult,
    WeeklyVolume,
    NeedsAttentionMember,
    RepsDataPoint,
    RepsProjectionResult,
)


def compute_e1rm(weight: float, reps: int) -> float:
    if reps <= 1:
        return round(weight, 1)
    return round(weight * (1 + reps / 30), 1)


def get_member_e1rm_series(
    member_id: int, db: Session
) -> Dict[int, List[E1RMDataPoint]]:
    """Returns e1RM time series grouped by exercise_id, excluding archived exercises."""
    archived_ids = {
        r[0] for r in db.query(MemberArchivedExercise.exercise_id)
        .filter(MemberArchivedExercise.member_id == member_id).all()
    }
    logs = (
        db.query(SessionLog)
        .filter(SessionLog.member_id == member_id)
        .order_by(SessionLog.date, SessionLog.id)
        .all()
    )

    # Group by exercise, then by date (take max e1RM per day), skip archived and bodyweight
    by_exercise: Dict[int, Dict[date, float]] = {}
    for log in logs:
        if log.exercise_id in archived_ids:
            continue
        if log.weight_lbs == 0:
            continue  # bodyweight exercises tracked separately via reps series
        e1rm = compute_e1rm(log.weight_lbs, log.reps)
        if log.exercise_id not in by_exercise:
            by_exercise[log.exercise_id] = {}
        existing = by_exercise[log.exercise_id].get(log.date, 0)
        by_exercise[log.exercise_id][log.date] = max(existing, e1rm)

    result: Dict[int, List[E1RMDataPoint]] = {}
    for ex_id, date_map in by_exercise.items():
        exercise = db.query(Exercise).filter(Exercise.id == ex_id).first()
        if not exercise:
            continue
        sorted_dates = sorted(date_map.keys())
        all_e1rms = [date_map[d] for d in sorted_dates]
        max_e1rm = max(all_e1rms) if all_e1rms else 0
        points = [
            E1RMDataPoint(
                date=d,
                e1rm=date_map[d],
                exercise_name=exercise.name,
                is_pr=(date_map[d] == max_e1rm),
            )
            for d in sorted_dates
        ]
        result[ex_id] = points

    return result


def get_member_volume_series(
    member_id: int, db: Session
) -> Dict[int, List[VolumeDataPoint]]:
    """Returns volume time series grouped by exercise_id."""
    logs = (
        db.query(SessionLog)
        .filter(SessionLog.member_id == member_id)
        .order_by(SessionLog.date, SessionLog.id)
        .all()
    )

    by_exercise: Dict[int, Dict[date, float]] = {}
    for log in logs:
        vol = log.volume
        if log.exercise_id not in by_exercise:
            by_exercise[log.exercise_id] = {}
        existing = by_exercise[log.exercise_id].get(log.date, 0.0)
        by_exercise[log.exercise_id][log.date] = existing + vol

    result: Dict[int, List[VolumeDataPoint]] = {}
    for ex_id, date_map in by_exercise.items():
        exercise = db.query(Exercise).filter(Exercise.id == ex_id).first()
        if not exercise:
            continue
        sorted_dates = sorted(date_map.keys())
        result[ex_id] = [
            VolumeDataPoint(date=d, volume=date_map[d], exercise_name=exercise.name)
            for d in sorted_dates
        ]

    return result


def compute_projection(
    exercise_id: int,
    exercise_name: str,
    dates: List[date],
    e1rms: List[float],
) -> ProjectionResult:
    """Compute LinearRegression projection using numpy (avoids sklearn dependency issues)."""
    if len(e1rms) < 3:
        return ProjectionResult(
            exercise_id=exercise_id,
            exercise_name=exercise_name,
            current_e1rm=e1rms[-1] if e1rms else 0.0,
            projected_4wk=e1rms[-1] if e1rms else 0.0,
            projected_8wk=e1rms[-1] if e1rms else 0.0,
            r_squared=0.0,
            insufficient_data=True,
        )

    origin = dates[0]
    X = np.array([(d - origin).days for d in dates], dtype=float)
    y = np.array(e1rms, dtype=float)

    # Manual linear regression for robustness
    X_mean = X.mean()
    y_mean = y.mean()
    numerator = ((X - X_mean) * (y - y_mean)).sum()
    denominator = ((X - X_mean) ** 2).sum()
    if denominator == 0:
        slope = 0.0
    else:
        slope = numerator / denominator
    intercept = y_mean - slope * X_mean

    last_day = X[-1]
    proj_4wk = max(slope * (last_day + 28) + intercept, 0.0)
    proj_8wk = max(slope * (last_day + 56) + intercept, 0.0)

    # R-squared
    y_pred = slope * X + intercept
    ss_res = ((y - y_pred) ** 2).sum()
    ss_tot = ((y - y_mean) ** 2).sum()
    r_squared = 1 - ss_res / ss_tot if ss_tot > 0 else 0.0

    return ProjectionResult(
        exercise_id=exercise_id,
        exercise_name=exercise_name,
        current_e1rm=round(float(e1rms[-1]), 1),
        projected_4wk=round(float(proj_4wk), 1),
        projected_8wk=round(float(proj_8wk), 1),
        r_squared=round(float(r_squared), 3),
        insufficient_data=False,
    )


def detect_plateau(
    exercise_id: int,
    exercise_name: str,
    e1rm_series: List[float],
) -> PlateauResult:
    """Plateau: no >2.5% increase in last 3 sessions."""
    if len(e1rm_series) < 3:
        return PlateauResult(
            exercise_id=exercise_id,
            exercise_name=exercise_name,
            is_plateau=False,
            sessions_analyzed=len(e1rm_series),
        )

    recent = e1rm_series[-3:]
    pct_changes = []
    for i in range(1, len(recent)):
        if recent[i - 1] > 0:
            pct_changes.append((recent[i] - recent[i - 1]) / recent[i - 1])

    is_plateau = all(p <= 0.025 for p in pct_changes)
    avg_change = sum(pct_changes) / len(pct_changes) if pct_changes else None

    return PlateauResult(
        exercise_id=exercise_id,
        exercise_name=exercise_name,
        is_plateau=is_plateau,
        last_3_pct_change=round(avg_change * 100, 2) if avg_change is not None else None,
        sessions_analyzed=len(e1rm_series),
    )


def get_projections_for_member(
    member_id: int, db: Session
) -> List[ProjectionResult]:
    e1rm_by_ex = get_member_e1rm_series(member_id, db)
    result = []
    for ex_id, points in e1rm_by_ex.items():
        dates = [p.date for p in points]
        e1rms = [p.e1rm for p in points]
        ex_name = points[0].exercise_name if points else ""
        result.append(compute_projection(ex_id, ex_name, dates, e1rms))
    return result


def get_plateaus_for_member(
    member_id: int, db: Session
) -> List[PlateauResult]:
    e1rm_by_ex = get_member_e1rm_series(member_id, db)
    result = []
    for ex_id, points in e1rm_by_ex.items():
        e1rms = [p.e1rm for p in points]
        ex_name = points[0].exercise_name if points else ""
        result.append(detect_plateau(ex_id, ex_name, e1rms))
    return result


def get_needs_attention(db: Session) -> List[NeedsAttentionMember]:
    """Members who haven't logged in 14 days or are plateauing on all exercises."""
    today = date.today()
    cutoff = today - timedelta(days=14)

    members = db.query(Member).filter(Member.active == True).all()
    result = []

    for member in members:
        reasons = []

        last_log = (
            db.query(SessionLog)
            .filter(SessionLog.member_id == member.id)
            .order_by(desc(SessionLog.date))
            .first()
        )

        days_since = None
        last_date = None
        if last_log:
            last_date = last_log.date
            days_since = (today - last_log.date).days
            if last_log.date < cutoff:
                reasons.append(f"No session in {days_since} days")
        else:
            reasons.append("No sessions logged yet")

        # Check plateau across weighted and bodyweight exercises
        e1rm_by_ex = get_member_e1rm_series(member.id, db)
        reps_by_ex = get_member_reps_series(member.id, db)
        all_plateau_checks = [
            detect_plateau(ex_id, "", [p.e1rm for p in pts])
            for ex_id, pts in e1rm_by_ex.items()
        ] + [
            detect_plateau(ex_id, "", [float(p.reps) for p in pts])
            for ex_id, pts in reps_by_ex.items()
        ]
        if all_plateau_checks and all(p.is_plateau for p in all_plateau_checks):
            reasons.append("Plateauing on all tracked exercises")

        if reasons:
            result.append(
                NeedsAttentionMember(
                    id=member.id,
                    name=member.name,
                    reasons=reasons,
                    days_since_last_session=days_since,
                    last_session_date=last_date,
                )
            )

    return result


def get_club_weekly_volume(db: Session) -> List[WeeklyVolume]:
    """Aggregate session volume by week."""
    logs = db.query(SessionLog).order_by(SessionLog.date).all()

    weekly: Dict[date, dict] = {}
    for log in logs:
        # Find Monday of this week
        monday = log.date - timedelta(days=log.date.weekday())
        if monday not in weekly:
            weekly[monday] = {"volume": 0.0, "count": 0}
        weekly[monday]["volume"] += log.volume
        weekly[monday]["count"] += 1

    return [
        WeeklyVolume(
            week_start=week,
            total_volume=round(data["volume"], 1),
            session_count=data["count"],
        )
        for week, data in sorted(weekly.items())
    ]


def get_member_reps_series(
    member_id: int, db: Session
) -> Dict[int, List[RepsDataPoint]]:
    """Returns max-reps time series grouped by exercise_id, for bodyweight (weight=0) exercises only."""
    archived_ids = {
        r[0] for r in db.query(MemberArchivedExercise.exercise_id)
        .filter(MemberArchivedExercise.member_id == member_id).all()
    }
    logs = (
        db.query(SessionLog)
        .filter(SessionLog.member_id == member_id, SessionLog.weight_lbs == 0)
        .order_by(SessionLog.date, SessionLog.id)
        .all()
    )

    by_exercise: Dict[int, Dict[date, int]] = {}
    for log in logs:
        if log.exercise_id in archived_ids:
            continue
        if not log.reps or log.reps <= 0:
            continue
        if log.exercise_id not in by_exercise:
            by_exercise[log.exercise_id] = {}
        existing = by_exercise[log.exercise_id].get(log.date, 0)
        by_exercise[log.exercise_id][log.date] = max(existing, log.reps)

    result: Dict[int, List[RepsDataPoint]] = {}
    for ex_id, date_map in by_exercise.items():
        exercise = db.query(Exercise).filter(Exercise.id == ex_id).first()
        if not exercise:
            continue
        sorted_dates = sorted(date_map.keys())
        all_reps = [date_map[d] for d in sorted_dates]
        max_reps = max(all_reps) if all_reps else 0
        result[ex_id] = [
            RepsDataPoint(
                date=d,
                reps=date_map[d],
                exercise_name=exercise.name,
                is_pr=(date_map[d] == max_reps),
            )
            for d in sorted_dates
        ]

    return result


def compute_reps_projection(
    exercise_id: int,
    exercise_name: str,
    dates: List[date],
    reps_series: List[int],
) -> RepsProjectionResult:
    """Linear regression projection on rep counts."""
    if len(reps_series) < 3:
        return RepsProjectionResult(
            exercise_id=exercise_id,
            exercise_name=exercise_name,
            current_reps=reps_series[-1] if reps_series else 0,
            projected_4wk=float(reps_series[-1]) if reps_series else 0.0,
            projected_8wk=float(reps_series[-1]) if reps_series else 0.0,
            r_squared=0.0,
            insufficient_data=True,
        )

    origin = dates[0]
    X = np.array([(d - origin).days for d in dates], dtype=float)
    y = np.array(reps_series, dtype=float)

    X_mean = X.mean()
    y_mean = y.mean()
    numerator = ((X - X_mean) * (y - y_mean)).sum()
    denominator = ((X - X_mean) ** 2).sum()
    slope = numerator / denominator if denominator != 0 else 0.0
    intercept = y_mean - slope * X_mean

    last_day = X[-1]
    proj_4wk = max(slope * (last_day + 28) + intercept, 0.0)
    proj_8wk = max(slope * (last_day + 56) + intercept, 0.0)

    y_pred = slope * X + intercept
    ss_res = ((y - y_pred) ** 2).sum()
    ss_tot = ((y - y_mean) ** 2).sum()
    r_squared = 1 - ss_res / ss_tot if ss_tot > 0 else 0.0

    return RepsProjectionResult(
        exercise_id=exercise_id,
        exercise_name=exercise_name,
        current_reps=int(reps_series[-1]),
        projected_4wk=round(float(proj_4wk), 1),
        projected_8wk=round(float(proj_8wk), 1),
        r_squared=round(float(r_squared), 3),
        insufficient_data=False,
    )


def get_reps_projections_for_member(
    member_id: int, db: Session
) -> List[RepsProjectionResult]:
    reps_by_ex = get_member_reps_series(member_id, db)
    result = []
    for ex_id, points in reps_by_ex.items():
        dates = [p.date for p in points]
        reps = [p.reps for p in points]
        ex_name = points[0].exercise_name if points else ""
        result.append(compute_reps_projection(ex_id, ex_name, dates, reps))
    return result


def get_reps_plateaus_for_member(
    member_id: int, db: Session
) -> List[PlateauResult]:
    reps_by_ex = get_member_reps_series(member_id, db)
    result = []
    for ex_id, points in reps_by_ex.items():
        reps = [float(p.reps) for p in points]
        ex_name = points[0].exercise_name if points else ""
        result.append(detect_plateau(ex_id, ex_name, reps))
    return result
