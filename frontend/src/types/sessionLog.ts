export interface SessionLog {
  id: number;
  member_id: number;
  exercise_id: number;
  date: string;
  sets: number;
  reps: number;
  weight_lbs: number;
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
  notes?: string;
}

export interface SessionLogUpdate {
  date?: string;
  sets?: number;
  reps?: number;
  weight_lbs?: number;
  notes?: string;
}

export interface LogRow {
  exercise_id: number;
  exercise_name: string;
  category: string;
  sets: string;
  reps: string;
  weight_lbs: string;
  notes: string;
  isDirty: boolean;
  placeholder_sets: string;
  placeholder_reps: string;
  placeholder_weight: string;
}
