export type Category = 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio' | 'Other';
export type TrackingType = 'weight_reps' | 'weight_duration';

export interface Exercise {
  id: number;
  name: string;
  category: Category;
  tracking_type: TrackingType;
  description: string | null;
  active: boolean;
  usage_count: number;
}

export interface ExerciseCreate {
  name: string;
  category?: Category;
  tracking_type?: TrackingType;
  description?: string;
}

export interface ExerciseUpdate {
  name?: string;
  category?: Category;
  tracking_type?: TrackingType;
  description?: string;
  active?: boolean;
}
