import { useRef } from 'react';
import type { LogRow } from '@/types/sessionLog';

interface Props {
  row: LogRow;
  isLast: boolean;
  onUpdate: (field: keyof LogRow, value: string) => void;
  onRemove: () => void;
  onTabLast?: () => void;
}

export default function ExerciseLogRow({ row, onUpdate, onRemove }: Props) {
  const weightRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 group">
      {/* Exercise name */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-800 truncate block">{row.exercise_name}</span>
      </div>

      {/* Weight */}
      <div className="w-28">
        <label className="sr-only">Weight (lbs)</label>
        <input
          ref={weightRef}
          type="number"
          min="0"
          step="2.5"
          className="input text-center"
          placeholder={row.placeholder_weight || 'lbs'}
          value={row.weight_lbs}
          onChange={(e) => onUpdate('weight_lbs', e.target.value)}
        />
      </div>

      {/* Reps or Duration */}
      <div className="w-24">
        {row.tracking_type === 'weight_duration' ? (
          <>
            <label className="sr-only">Duration (sec)</label>
            <input
              type="number"
              min="0"
              className="input text-center"
              placeholder={row.placeholder_duration || 'Sec'}
              value={row.duration}
              onChange={(e) => onUpdate('duration', e.target.value)}
            />
          </>
        ) : (
          <>
            <label className="sr-only">Reps</label>
            <input
              type="number"
              min="1"
              className="input text-center"
              placeholder={row.placeholder_reps || 'Reps'}
              value={row.reps}
              onChange={(e) => onUpdate('reps', e.target.value)}
            />
          </>
        )}
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        title="Remove exercise"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
