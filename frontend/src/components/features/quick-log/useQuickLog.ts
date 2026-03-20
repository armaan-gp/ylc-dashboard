import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { membersApi } from '@/api/members';
import { exercisesApi } from '@/api/exercises';
import { logsApi } from '@/api/sessionLogs';
import type { LogRow } from '@/types/sessionLog';
import type { MemberExerciseLastLog } from '@/types/member';
import type { Exercise } from '@/types/exercise';

export interface MemberSessionPayload {
  memberId: number;
  logRows: LogRow[];
}

export function useQuickLog() {
  const [saving, setSaving] = useState(false);

  const loadMemberExercises = useCallback(async (memberId: number): Promise<LogRow[]> => {
    const exercises = await membersApi.getExercises(memberId);
    return (exercises as MemberExerciseLastLog[]).map((ex) => ({
      exercise_id: ex.exercise_id,
      exercise_name: ex.exercise_name,
      category: ex.category,
      tracking_type: (ex.tracking_type as 'weight_reps' | 'weight_duration') || 'weight_reps',
      reps: '',
      duration: '',
      weight_lbs: '',
      notes: '',
      isDirty: false,
      placeholder_reps: ex.last_reps != null ? String(ex.last_reps) : '',
      placeholder_duration: ex.last_duration_seconds != null ? String(ex.last_duration_seconds) : '',
      placeholder_weight: ex.last_weight_lbs != null ? String(ex.last_weight_lbs) : '',
    }));
  }, []);

  const createExercise = useCallback(async (
    name: string,
    category: string,
    tracking_type: 'weight_reps' | 'weight_duration',
  ): Promise<Exercise> => {
    return exercisesApi.create({
      name,
      category: category as never,
      tracking_type,
    });
  }, []);

  const saveAll = useCallback(async (
    sessions: MemberSessionPayload[],
    date?: string,
  ): Promise<boolean> => {
    const payload = sessions.flatMap(({ memberId, logRows }) =>
      logRows
        .filter((row) => {
          const hasWeight = row.weight_lbs !== '' || row.placeholder_weight !== '';
          if (row.tracking_type === 'weight_duration') {
            return hasWeight && (row.duration !== '' || row.placeholder_duration !== '');
          }
          return hasWeight && (row.reps !== '' || row.placeholder_reps !== '');
        })
        .map((row) => ({
          member_id: memberId,
          exercise_id: row.exercise_id,
          sets: 1,
          reps: row.tracking_type === 'weight_duration' ? 1 : parseInt(row.reps || row.placeholder_reps),
          weight_lbs: parseFloat(row.weight_lbs || row.placeholder_weight),
          duration_seconds: row.tracking_type === 'weight_duration'
            ? parseFloat(row.duration || row.placeholder_duration)
            : undefined,
          notes: row.notes || undefined,
          ...(date ? { date } : {}),
        }))
    );

    if (payload.length === 0) {
      toast.error('No entries to save. Fill in at least one exercise.');
      return false;
    }

    for (const item of payload) {
      if (isNaN(item.weight_lbs) || item.weight_lbs < 0) {
        toast.error('Some weight values are invalid.');
        return false;
      }
    }

    setSaving(true);
    try {
      await logsApi.bulkUpsert(payload);
      const memberCount = new Set(payload.map((p) => p.member_id)).size;
      toast.success(
        `Saved ${payload.length} exercise${payload.length !== 1 ? 's' : ''} for ${memberCount} member${memberCount !== 1 ? 's' : ''}`
      );
      return true;
    } catch {
      toast.error('Failed to save. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, loadMemberExercises, createExercise, saveAll };
}
