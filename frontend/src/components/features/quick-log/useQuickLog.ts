import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { membersApi } from '@/api/members';
import { exercisesApi } from '@/api/exercises';
import { logsApi } from '@/api/sessionLogs';
import type { LogRow } from '@/types/sessionLog';
import type { MemberExerciseLastLog } from '@/types/member';

export function useQuickLog() {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [logRows, setLogRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadMemberExercises = useCallback(async (memberId: number) => {
    setLoading(true);
    setLogRows([]);
    try {
      const exercises = await membersApi.getExercises(memberId);
      const rows: LogRow[] = exercises.map((ex: MemberExerciseLastLog) => ({
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        category: ex.category,
        sets: '',
        reps: '',
        weight_lbs: '',
        notes: '',
        isDirty: false,
        placeholder_sets: ex.last_sets != null ? String(ex.last_sets) : '',
        placeholder_reps: ex.last_reps != null ? String(ex.last_reps) : '',
        placeholder_weight: ex.last_weight_lbs != null ? String(ex.last_weight_lbs) : '',
      }));
      setLogRows(rows);
    } catch {
      toast.error('Failed to load exercises for this member');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectMember = useCallback(
    (memberId: number | null) => {
      setSelectedMemberId(memberId);
      if (memberId) loadMemberExercises(memberId);
      else setLogRows([]);
    },
    [loadMemberExercises]
  );

  const updateRow = useCallback((exerciseId: number, field: keyof LogRow, value: string) => {
    setLogRows((prev) =>
      prev.map((row) =>
        row.exercise_id === exerciseId ? { ...row, [field]: value, isDirty: true } : row
      )
    );
  }, []);

  const addExercise = useCallback(
    async (name: string, category: string) => {
      if (!selectedMemberId) return;
      try {
        const exercise = await exercisesApi.create({ name, category: category as never });
        const existing = logRows.find((r) => r.exercise_id === exercise.id);
        if (!existing) {
          setLogRows((prev) => [
            ...prev,
            {
              exercise_id: exercise.id,
              exercise_name: exercise.name,
              category: exercise.category,
              sets: '',
              reps: '',
              weight_lbs: '',
              notes: '',
              isDirty: true,
              placeholder_sets: '',
              placeholder_reps: '',
              placeholder_weight: '',
            },
          ]);
        }
      } catch {
        toast.error('Failed to create exercise');
      }
    },
    [selectedMemberId, logRows]
  );

  const removeRow = useCallback((exerciseId: number) => {
    setLogRows((prev) => prev.filter((r) => r.exercise_id !== exerciseId));
  }, []);

  const saveAll = useCallback(async () => {
    if (!selectedMemberId) return;

    const dirtyRows = logRows.filter((row) => {
      const hasSets = row.sets !== '' || row.placeholder_sets !== '';
      const hasReps = row.reps !== '' || row.placeholder_reps !== '';
      const hasWeight = row.weight_lbs !== '' || row.placeholder_weight !== '';
      return hasSets && hasReps && hasWeight;
    });

    if (dirtyRows.length === 0) {
      toast.error('No entries to save. Fill in at least one exercise.');
      return;
    }

    const payload = dirtyRows.map((row) => ({
      member_id: selectedMemberId,
      exercise_id: row.exercise_id,
      sets: parseInt(row.sets || row.placeholder_sets),
      reps: parseInt(row.reps || row.placeholder_reps),
      weight_lbs: parseFloat(row.weight_lbs || row.placeholder_weight),
      notes: row.notes || undefined,
    }));

    // Validate
    for (const item of payload) {
      if (isNaN(item.sets) || isNaN(item.reps) || isNaN(item.weight_lbs)) {
        toast.error('Please check your entries — some values are not valid numbers');
        return;
      }
    }

    setSaving(true);
    try {
      await logsApi.bulkUpsert(payload);
      toast.success(`Saved ${payload.length} exercise${payload.length > 1 ? 's' : ''} for member`);
      // Reset dirty flags and refresh prefill values
      if (selectedMemberId) loadMemberExercises(selectedMemberId);
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [selectedMemberId, logRows, loadMemberExercises]);

  return {
    selectedMemberId,
    logRows,
    loading,
    saving,
    selectMember,
    updateRow,
    addExercise,
    removeRow,
    saveAll,
  };
}
