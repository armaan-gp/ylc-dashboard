export interface ClubStats {
  total_members: number;
  active_members: number;
  sessions_this_week: number;
  sessions_this_month: number;
  most_active_member_name: string | null;
  top_exercise_name: string | null;
  total_sessions: number;
}

export interface E1RMDataPoint {
  date: string;
  e1rm: number;
  exercise_name: string;
  is_pr: boolean;
}

export interface VolumeDataPoint {
  date: string;
  volume: number;
  exercise_name: string;
}

export interface ProjectionResult {
  exercise_id: number;
  exercise_name: string;
  current_e1rm: number;
  projected_4wk: number;
  projected_8wk: number;
  r_squared: number;
  insufficient_data: boolean;
}

export interface PlateauResult {
  exercise_id: number;
  exercise_name: string;
  is_plateau: boolean;
  last_3_pct_change: number | null;
  sessions_analyzed: number;
}

export interface Recommendation {
  exercise_id: number;
  exercise_name: string;
  recommendation_type: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
}

export interface NeedsAttentionMember {
  id: number;
  name: string;
  reasons: string[];
  days_since_last_session: number | null;
  last_session_date: string | null;
}

export interface WeeklyVolume {
  week_start: string;
  total_volume: number;
  session_count: number;
}

export interface TopPerformer {
  member_id: number;
  member_name: string;
  exercise_name: string;
  e1rm_gain_pct: number;
  current_e1rm: number;
}
