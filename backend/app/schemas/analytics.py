from datetime import date
from typing import Optional, List
from pydantic import BaseModel


class ClubStats(BaseModel):
    total_members: int
    active_members: int
    sessions_this_week: int
    sessions_this_month: int
    most_active_member_name: Optional[str]
    top_exercise_name: Optional[str]
    total_sessions: int


class E1RMDataPoint(BaseModel):
    date: date
    e1rm: float
    exercise_name: str
    is_pr: bool = False


class VolumeDataPoint(BaseModel):
    date: date
    volume: float
    exercise_name: str


class ProjectionResult(BaseModel):
    exercise_id: int
    exercise_name: str
    current_e1rm: float
    projected_4wk: float
    projected_8wk: float
    r_squared: float
    insufficient_data: bool = False


class PlateauResult(BaseModel):
    exercise_id: int
    exercise_name: str
    is_plateau: bool
    last_3_pct_change: Optional[float] = None
    sessions_analyzed: int = 0


class Recommendation(BaseModel):
    exercise_id: int
    exercise_name: str
    recommendation_type: str
    message: str
    severity: str = "info"  # info, warning, success


class NeedsAttentionMember(BaseModel):
    id: int
    name: str
    reasons: List[str]
    days_since_last_session: Optional[int]
    last_session_date: Optional[date]


class WeeklyVolume(BaseModel):
    week_start: date
    total_volume: float
    session_count: int


class TopPerformer(BaseModel):
    member_id: int
    member_name: str
    exercise_name: str
    e1rm_gain_pct: float
    current_e1rm: float


class TopRepGainer(BaseModel):
    member_id: int
    member_name: str
    exercise_name: str
    reps_gain_pct: float
    current_reps: int


class RepsDataPoint(BaseModel):
    date: date
    reps: int
    exercise_name: str
    is_pr: bool = False


class RepsProjectionResult(BaseModel):
    exercise_id: int
    exercise_name: str
    current_reps: int
    projected_4wk: float
    projected_8wk: float
    r_squared: float
    insufficient_data: bool = False
