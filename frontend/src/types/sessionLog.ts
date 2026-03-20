export interface SessionLog {
  id: number;
  member_id: number;
  exercise_id: number;
  date: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  duration_seconds: number | null;
  notes: string | null;
  e1rm: number;
  volume: number;
  member_name: string;
  exercise_name: string;
}

export interface SessionLogCreate {
  member_id: number;
  exercise_id: number;
  date?: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  duration_seconds?: number;
  notes?: string;
}

export interface SessionLogUpdate {
  date?: string;
  sets?: number;
  reps?: number;
  weight_lbs?: number;
  duration_seconds?: number;
  notes?: string;
}

export interface LogRow {
  exercise_id: number;
  exercise_name: string;
  category: string;
  tracking_type: 'weight_reps' | 'weight_duration';
  reps: string;
  duration: string;
  weight_lbs: string;
  notes: string;
  isDirty: boolean;
  placeholder_reps: string;
  placeholder_duration: string;
  placeholder_weight: string;
}
