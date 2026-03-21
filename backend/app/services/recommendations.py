from datetime import date, timedelta
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.session_log import SessionLog
from app.services.analytics import get_member_e1rm_series, get_member_reps_series, detect_plateau, compute_e1rm
from app.schemas.analytics import Recommendation


def get_recommendations_for_member(
    member_id: int, db: Session
) -> List[Recommendation]:
    today = date.today()
    e1rm_by_ex = get_member_e1rm_series(member_id, db)
    recommendations = []

    for ex_id, points in e1rm_by_ex.items():
        ex_name = points[0].exercise_name if points else "Unknown"
        e1rms = [p.e1rm for p in points]

        # Get last log for this exercise
        last_log = (
            db.query(SessionLog)
            .filter(
                SessionLog.member_id == member_id,
                SessionLog.exercise_id == ex_id,
            )
            .order_by(desc(SessionLog.date), desc(SessionLog.id))
            .first()
        )
        if not last_log:
            continue

        days_since = (today - last_log.date).days

        # 1. Inactivity check
        if days_since > 14:
            recommendations.append(
                Recommendation(
                    exercise_id=ex_id,
                    exercise_name=ex_name,
                    recommendation_type="inactivity",
                    message=f"You haven't logged {ex_name} in {days_since} days. Consider getting back on track!",
                    severity="warning",
                )
            )
            continue

        # 2. Deload check: e1RM declined >5% from second-to-last to last
        if len(e1rms) >= 2:
            prev, curr = e1rms[-2], e1rms[-1]
            if prev > 0 and (prev - curr) / prev > 0.05:
                recommendations.append(
                    Recommendation(
                        exercise_id=ex_id,
                        exercise_name=ex_name,
                        recommendation_type="deload",
                        message=f"Your {ex_name} e1RM dropped recently. Consider a deload week — reduce weight by 10-15% and focus on form.",
                        severity="warning",
                    )
                )
                continue

        # 3. Plateau detection
        plateau = detect_plateau(ex_id, ex_name, e1rms)
        if plateau.is_plateau and len(e1rms) >= 3:
            if last_log.reps < 10:
                recommendations.append(
                    Recommendation(
                        exercise_id=ex_id,
                        exercise_name=ex_name,
                        recommendation_type="plateau_reps",
                        message=f"You're plateauing on {ex_name}. Try adding 1-2 reps per set before increasing weight.",
                        severity="warning",
                    )
                )
            else:
                recommendations.append(
                    Recommendation(
                        exercise_id=ex_id,
                        exercise_name=ex_name,
                        recommendation_type="plateau_weight",
                        message=f"You've mastered your current weight on {ex_name}. Add 5 lbs and drop reps to 5-6 to break through.",
                        severity="warning",
                    )
                )
            continue

        # 4. Good progress
        if len(e1rms) >= 2:
            prev, curr = e1rms[-2], e1rms[-1]
            if prev > 0 and (curr - prev) / prev > 0.025:
                pct = round((curr - prev) / prev * 100, 1)
                recommendations.append(
                    Recommendation(
                        exercise_id=ex_id,
                        exercise_name=ex_name,
                        recommendation_type="progress",
                        message=f"Great job on {ex_name}! Your estimated 1RM is up {pct}% — keep it up.",
                        severity="success",
                    )
                )
            else:
                recommendations.append(
                    Recommendation(
                        exercise_id=ex_id,
                        exercise_name=ex_name,
                        recommendation_type="consistent",
                        message=f"Staying consistent on {ex_name}. Aim for small, steady increases each session.",
                        severity="info",
                    )
                )

    # Bodyweight exercise recommendations (weight=0, rep-based progress)
    reps_by_ex = get_member_reps_series(member_id, db)
    for ex_id, points in reps_by_ex.items():
        ex_name = points[0].exercise_name if points else "Unknown"
        reps_series = [p.reps for p in points]

        last_log = (
            db.query(SessionLog)
            .filter(
                SessionLog.member_id == member_id,
                SessionLog.exercise_id == ex_id,
            )
            .order_by(desc(SessionLog.date), desc(SessionLog.id))
            .first()
        )
        if not last_log:
            continue

        days_since = (today - last_log.date).days

        if days_since > 14:
            recommendations.append(
                Recommendation(
                    exercise_id=ex_id,
                    exercise_name=ex_name,
                    recommendation_type="inactivity",
                    message=f"You haven't logged {ex_name} in {days_since} days. Consider getting back on track!",
                    severity="warning",
                )
            )
            continue

        if len(reps_series) >= 2:
            prev, curr = reps_series[-2], reps_series[-1]
            if prev > 0 and (prev - curr) / prev > 0.10:
                recommendations.append(
                    Recommendation(
                        exercise_id=ex_id,
                        exercise_name=ex_name,
                        recommendation_type="reps_decline",
                        message=f"Your rep count on {ex_name} dropped recently. Focus on quality reps and make sure you're well rested.",
                        severity="warning",
                    )
                )
                continue

        plateau = detect_plateau(ex_id, ex_name, [float(r) for r in reps_series])
        if plateau.is_plateau and len(reps_series) >= 3:
            recommendations.append(
                Recommendation(
                    exercise_id=ex_id,
                    exercise_name=ex_name,
                    recommendation_type="reps_plateau",
                    message=f"Your reps on {ex_name} have leveled off. Try a harder variation, add sets, or reduce rest time to push past the plateau.",
                    severity="warning",
                )
            )
            continue

        if len(reps_series) >= 2:
            prev, curr = reps_series[-2], reps_series[-1]
            if prev > 0 and curr > prev:
                gain = curr - prev
                recommendations.append(
                    Recommendation(
                        exercise_id=ex_id,
                        exercise_name=ex_name,
                        recommendation_type="reps_progress",
                        message=f"Nice work on {ex_name}! You're up {gain} rep{'s' if gain != 1 else ''} — keep building that rep base.",
                        severity="success",
                    )
                )
            else:
                recommendations.append(
                    Recommendation(
                        exercise_id=ex_id,
                        exercise_name=ex_name,
                        recommendation_type="reps_consistent",
                        message=f"Staying consistent on {ex_name}. Aim to add 1-2 reps each session to keep progressing.",
                        severity="info",
                    )
                )

    return recommendations
