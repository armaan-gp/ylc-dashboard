import client from './client';
import type { Exercise, ExerciseCreate, ExerciseUpdate } from '@/types/exercise';

export const exercisesApi = {
  list: (params?: { category?: string; search?: string; active_only?: boolean }) =>
    client.get<Exercise[]>('/api/exercises', { params }).then((r) => r.data),

  create: (data: ExerciseCreate) =>
    client.post<Exercise>('/api/exercises', data).then((r) => r.data),

  update: (id: number, data: ExerciseUpdate) =>
    client.patch<Exercise>(`/api/exercises/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/exercises/${id}`),
};
