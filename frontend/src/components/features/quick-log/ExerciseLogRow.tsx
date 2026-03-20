import { useRef } from 'react';
import type { LogRow } from '@/types/sessionLog';

interface Props {
  row: LogRow;
  isLast: boolean;
  onUpdate: (field: keyof LogRow, value: string) => void;
  onRemove: () => void;
  onTabLast?: () => void; // called when Tab pressed on last field of last row
}

export default function ExerciseLogRow({ row, isLast, onUpdate, onRemove, onTabLast }: Props) {
  const weightRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    isLastField: boolean
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isLastField && isLast && onTabLast) onTabLast();
    }
  };

  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0 group">
      {/* Exercise name + category */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-800 truncate">{row.exercise_name}</span>
      </div>

      {/* Sets */}
      <div className="w-16">
        <label className="sr-only">Sets</label>
        <input
          type="number"
          min="1"
          className="input-sm text-center"
          placeholder={row.placeholder_sets || 'Sets'}
          value={row.sets}
          onChange={(e) => onUpdate('sets', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, false)}
        />
      </div>

      {/* Reps */}
      <div className="w-16">
        <label className="sr-only">Reps</label>
        <input
          type="number"
          min="1"
          className="input-sm text-center"
          placeholder={row.placeholder_reps || 'Reps'}
          value={row.reps}
          onChange={(e) => onUpdate('reps', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, false)}
        />
      </div>

      {/* Weight */}
      <div className="w-20">
        <label className="sr-only">Weight (lbs)</label>
        <input
          ref={weightRef}
          type="number"
          min="0"
          step="2.5"
          className="input-sm text-center"
          placeholder={row.placeholder_weight || 'lbs'}
          value={row.weight_lbs}
          onChange={(e) => onUpdate('weight_lbs', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, true)}
        />
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
