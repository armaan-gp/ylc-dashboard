import client from './client';
import type { Member, MemberCreate, MemberUpdate, MemberExerciseLastLog } from '@/types/member';

export const membersApi = {
  list: (params?: { active_only?: boolean; search?: string }) =>
    client.get<Member[]>('/api/members', { params }).then((r) => r.data),

  get: (id: number) =>
    client.get<Member>(`/api/members/${id}`).then((r) => r.data),

  create: (members: MemberCreate[]) =>
    client.post<Member[]>('/api/members', members).then((r) => r.data),

  update: (id: number, data: MemberUpdate) =>
    client.patch<Member>(`/api/members/${id}`, data).then((r) => r.data),

  deactivate: (id: number) =>
    client.delete(`/api/members/${id}`),

  getExercises: (id: number) =>
    client.get<MemberExerciseLastLog[]>(`/api/members/${id}/exercises`).then((r) => r.data),
};
