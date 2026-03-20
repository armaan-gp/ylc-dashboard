import { useState, useRef, useEffect } from 'react';
import ExerciseLogRow from './ExerciseLogRow';
import type { Member } from '@/types/member';
import type { Exercise } from '@/types/exercise';
import type { LogRow } from '@/types/sessionLog';

interface Props {
  sectionId: string;
  members: Member[];
  allExercises: Exercise[];
  loadMemberExercises: (memberId: number) => Promise<LogRow[]>;
  createExercise: (name: string, category: string, tracking_type: 'weight_reps' | 'weight_duration') => Promise<Exercise>;
  onDataChange: (sectionId: string, memberId: number | null, logRows: LogRow[]) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function MemberSection({
  sectionId,
  members,
  allExercises,
  loadMemberExercises,
  createExercise,
  onDataChange,
  onRemove,
  canRemove,
}: Props) {
  const [memberId, setMemberId] = useState<number | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [logRows, setLogRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [exSearch, setExSearch] = useState('');
  const [showExDropdown, setShowExDropdown] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExTrackingType, setNewExTrackingType] = useState<'weight_reps' | 'weight_duration'>('weight_reps');

  const addExInputRef = useRef<HTMLInputElement>(null);

  const sortedMembers = members
    .filter((m) => m.name.toLowerCase().includes(memberSearch.toLowerCase()))
    .sort((a, b) => {
      const lastA = a.name.split(' ').pop()!.toLowerCase();
      const lastB = b.name.split(' ').pop()!.toLowerCase();
      return lastA.localeCompare(lastB);
    });

  const filteredExercises = allExercises.filter(
    (e) =>
      e.name.toLowerCase().includes(exSearch.toLowerCase()) &&
      !logRows.some((r) => r.exercise_id === e.id)
  );

  const handleMemberSelect = async (member: Member) => {
    setMemberSearch(member.name);
    setShowMemberDropdown(false);
    setMemberId(member.id);
    setLoading(true);
    try {
      const rows = await loadMemberExercises(member.id);
      setLogRows(rows);
      onDataChange(sectionId, member.id, rows);
    } catch {
      setLogRows([]);
      onDataChange(sectionId, member.id, []);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClear = () => {
    setMemberSearch('');
    setMemberId(null);
    setLogRows([]);
    onDataChange(sectionId, null, []);
  };

  const updateRow = (exerciseId: number, field: keyof LogRow, value: string) => {
    setLogRows((prev) => {
      const updated = prev.map((row) =>
        row.exercise_id === exerciseId ? { ...row, [field]: value, isDirty: true } : row
      );
      onDataChange(sectionId, memberId, updated);
      return updated;
    });
  };

  const removeRow = (exerciseId: number) => {
    setLogRows((prev) => {
      const updated = prev.filter((r) => r.exercise_id !== exerciseId);
      onDataChange(sectionId, memberId, updated);
      return updated;
    });
  };

  const handleAddExisting = (ex: Exercise) => {
    setExSearch('');
    setShowExDropdown(false);
    const newRow: LogRow = {
      exercise_id: ex.id,
      exercise_name: ex.name,
      category: ex.category,
      tracking_type: ex.tracking_type,
      reps: '',
      duration: '',
      weight_lbs: '',
      notes: '',
      isDirty: true,
      placeholder_reps: '',
      placeholder_duration: '',
      placeholder_weight: '',
    };
    setLogRows((prev) => {
      const updated = [...prev, newRow];
      onDataChange(sectionId, memberId, updated);
      return updated;
    });
  };

  const handleCreateExercise = async () => {
    if (!newExName.trim()) return;
    const ex = await createExercise(newExName.trim(), 'Other', newExTrackingType);
    const newRow: LogRow = {
      exercise_id: ex.id,
      exercise_name: ex.name,
      category: ex.category,
      tracking_type: ex.tracking_type,
      reps: '',
      duration: '',
      weight_lbs: '',
      notes: '',
      isDirty: true,
      placeholder_reps: '',
      placeholder_duration: '',
      placeholder_weight: '',
    };
    setLogRows((prev) => {
      const updated = [...prev, newRow];
      onDataChange(sectionId, memberId, updated);
      return updated;
    });
    setNewExName('');
    setNewExTrackingType('weight_reps');
    setShowAddExercise(false);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
      {/* Member selector row */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1 relative">
          <label className="label text-xs">Member</label>
          <input
            type="text"
            className="input"
            placeholder="Search member..."
            value={memberSearch}
            onChange={(e) => {
              setMemberSearch(e.target.value);
              setShowMemberDropdown(true);
              if (!e.target.value) handleMemberClear();
            }}
            onFocus={() => setShowMemberDropdown(true)}
            onBlur={() => setTimeout(() => setShowMemberDropdown(false), 150)}
            autoComplete="off"
          />
          {showMemberDropdown && sortedMembers.length > 0 && (
            <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
              {sortedMembers.map((m) => (
                <li
                  key={m.id}
                  onMouseDown={() => handleMemberSelect(m)}
                  className={`px-3 py-2.5 cursor-pointer text-sm hover:bg-gray-50 flex items-center justify-between ${
                    m.id === memberId ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{m.name}</span>
                  {m.last_session && (
                    <span className="text-xs text-gray-400">
                      {new Date(m.last_session + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-5 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove member"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Exercise area */}
      {memberId ? (
        loading ? (
          <p className="text-sm text-gray-400 py-3 text-center">Loading exercises...</p>
        ) : (
          <>
            {/* Column headers */}
            {logRows.length > 0 && (
              <div className="flex items-center gap-3 mb-1 px-1">
                <div className="flex-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Exercise</div>
                <div className="w-24 text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Reps / Sec</div>
                <div className="w-28 text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Weight (lbs)</div>
                <div className="w-6" />
              </div>
            )}

            {logRows.map((row) => (
              <ExerciseLogRow
                key={row.exercise_id}
                row={row}
                isLast={false}
                onUpdate={(field, value) => updateRow(row.exercise_id, field, value)}
                onRemove={() => removeRow(row.exercise_id)}
              />
            ))}

            {logRows.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3">No exercises yet. Add one below.</p>
            )}

            {/* Add exercise */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              {!showAddExercise ? (
                <div className="relative">
                  <input
                    type="text"
                    className="input input-sm"
                    placeholder="Add exercise..."
                    value={exSearch}
                    onChange={(e) => { setExSearch(e.target.value); setShowExDropdown(true); }}
                    onFocus={() => setShowExDropdown(true)}
                    onBlur={() => setTimeout(() => setShowExDropdown(false), 150)}
                    autoComplete="off"
                  />
                  {showExDropdown && (exSearch || filteredExercises.length > 0) && (
                    <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredExercises.slice(0, 8).map((ex) => (
                        <li
                          key={ex.id}
                          onMouseDown={() => handleAddExisting(ex)}
                          className="px-3 py-2.5 cursor-pointer text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>{ex.name}</span>
                          <span className="text-xs text-gray-400">
                            {ex.tracking_type === 'weight_duration' ? 'Duration' : 'Reps'}
                          </span>
                        </li>
                      ))}
                      {exSearch && !allExercises.some((e) => e.name.toLowerCase() === exSearch.toLowerCase()) && (
                        <li
                          onMouseDown={() => {
                            setNewExName(exSearch);
                            setExSearch('');
                            setShowExDropdown(false);
                            setShowAddExercise(true);
                            setTimeout(() => addExInputRef.current?.focus(), 50);
                          }}
                          className="px-3 py-2.5 cursor-pointer text-sm text-primary-600 hover:bg-primary-50 font-medium"
                        >
                          + Create "{exSearch}"
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">New exercise</p>
                  <input
                    ref={addExInputRef}
                    type="text"
                    className="input"
                    placeholder="Exercise name"
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateExercise(); }}
                  />
                  {/* Tracking type selection */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-500">Tracked by</p>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`tracking-${sectionId}`}
                          value="weight_reps"
                          checked={newExTrackingType === 'weight_reps'}
                          onChange={() => setNewExTrackingType('weight_reps')}
                          className="text-primary-600"
                        />
                        <span className="text-sm text-gray-700">Weight &amp; Reps</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`tracking-${sectionId}`}
                          value="weight_duration"
                          checked={newExTrackingType === 'weight_duration'}
                          onChange={() => setNewExTrackingType('weight_duration')}
                          className="text-primary-600"
                        />
                        <span className="text-sm text-gray-700">Weight &amp; Duration</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button className="btn-secondary btn-sm" onClick={() => { setShowAddExercise(false); setNewExName(''); }}>Cancel</button>
                    <button className="btn-primary btn-sm" onClick={handleCreateExercise}>Add</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )
      ) : (
        <p className="text-sm text-gray-400 text-center py-3">Select a member to log exercises</p>
      )}
    </div>
  );
}
