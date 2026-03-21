import client from './client';
import type {
  ClubStats,
  E1RMDataPoint,
  VolumeDataPoint,
  ProjectionResult,
  PlateauResult,
  Recommendation,
  NeedsAttentionMember,
  WeeklyVolume,
  TopPerformer,
  TopRepGainer,
  RepsDataPoint,
  RepsProjectionResult,
} from '@/types/analytics';

export const analyticsApi = {
  clubStats: () =>
    client.get<ClubStats>('/api/analytics/club-stats').then((r) => r.data),

  memberE1RM: (memberId: number, exerciseId?: number) =>
    client
      .get<E1RMDataPoint[]>(`/api/analytics/member/${memberId}/e1rm`, {
        params: exerciseId ? { exercise_id: exerciseId } : {},
      })
      .then((r) => r.data),

  memberVolume: (memberId: number, exerciseId?: number) =>
    client
      .get<VolumeDataPoint[]>(`/api/analytics/member/${memberId}/volume`, {
        params: exerciseId ? { exercise_id: exerciseId } : {},
      })
      .then((r) => r.data),

  memberProjection: (memberId: number) =>
    client
      .get<ProjectionResult[]>(`/api/analytics/member/${memberId}/projection`)
      .then((r) => r.data),

  memberPlateau: (memberId: number) =>
    client
      .get<PlateauResult[]>(`/api/analytics/member/${memberId}/plateau`)
      .then((r) => r.data),

  memberRecommendations: (memberId: number) =>
    client
      .get<Recommendation[]>(`/api/analytics/member/${memberId}/recommendations`)
      .then((r) => r.data),

  needsAttention: () =>
    client.get<NeedsAttentionMember[]>('/api/analytics/needs-attention').then((r) => r.data),

  clubVolume: () =>
    client.get<WeeklyVolume[]>('/api/analytics/club-volume').then((r) => r.data),

  topPerformers: (params?: { date_from?: string; date_to?: string }) =>
    client.get<TopPerformer[]>('/api/analytics/top-performers', { params }).then((r) => r.data),

  topRepGainers: (params?: { date_from?: string; date_to?: string }) =>
    client.get<TopRepGainer[]>('/api/analytics/top-rep-gainers', { params }).then((r) => r.data),

  memberReps: (memberId: number, exerciseId?: number) =>
    client
      .get<RepsDataPoint[]>(`/api/analytics/member/${memberId}/reps`, {
        params: exerciseId ? { exercise_id: exerciseId } : {},
      })
      .then((r) => r.data),

  memberRepsProjection: (memberId: number) =>
    client
      .get<RepsProjectionResult[]>(`/api/analytics/member/${memberId}/reps-projection`)
      .then((r) => r.data),

  memberRepsPlateau: (memberId: number) =>
    client
      .get<PlateauResult[]>(`/api/analytics/member/${memberId}/reps-plateau`)
      .then((r) => r.data),
};
