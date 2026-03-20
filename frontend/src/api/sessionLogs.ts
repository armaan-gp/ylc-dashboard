import client from './client';
import type { SessionLog, SessionLogCreate, SessionLogUpdate } from '@/types/sessionLog';

export const logsApi = {
  list: (params?: {
    member_id?: number;
    exercise_id?: number;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }) => client.get<SessionLog[]>('/api/logs', { params }).then((r) => r.data),

  recent: (limit = 20) =>
    client.get<SessionLog[]>('/api/logs/recent', { params: { limit } }).then((r) => r.data),

  bulkUpsert: (logs: SessionLogCreate[]) =>
    client.post<SessionLog[]>('/api/logs', logs).then((r) => r.data),

  update: (id: number, data: SessionLogUpdate) =>
    client.patch<SessionLog>(`/api/logs/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/api/logs/${id}`),
};
