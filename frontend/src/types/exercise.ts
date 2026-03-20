export type Category = 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio' | 'Other';

export interface Exercise {
  id: number;
  name: string;
  category: Category;
  description: string | null;
  active: boolean;
  usage_count: number;
}

export interface ExerciseCreate {
  name: string;
  category?: Category;
  description?: string;
}

export interface ExerciseUpdate {
  name?: string;
  category?: Category;
  description?: string;
  active?: boolean;
}
