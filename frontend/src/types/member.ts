export interface Member {
  id: number;
  name: string;
  join_date: string;
  active: boolean;
  notes: string | null;
  last_session: string | null;
  session_count: number;
}

export interface MemberCreate {
  name: string;
  join_date?: string;
  active?: boolean;
  notes?: string;
}

export interface MemberUpdate {
  name?: string;
  join_date?: string;
  active?: boolean;
  notes?: string;
}

export interface MemberExerciseLastLog {
  exercise_id: number;
  exercise_name: string;
  category: string;
  last_sets: number | null;
  last_reps: number | null;
  last_weight_lbs: number | null;
  last_date: string | null;
  last_e1rm: number | null;
}
