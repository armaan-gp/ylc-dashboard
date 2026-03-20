import { useState, useEffect, useRef } from 'react';
import { useQuickLog } from './useQuickLog';
import ExerciseLogRow from './ExerciseLogRow';
import { membersApi } from '@/api/members';
import { exercisesApi } from '@/api/exercises';
import type { Member } from '@/types/member';
import type { Exercise } from '@/types/exercise';
import type { LogRow } from '@/types/sessionLog';
import Spinner from '@/components/ui/Spinner';

const CATEGORIES = ['Push', 'Pull', 'Legs', 'Core', 'Cardio', 'Other'];

export default function QuickLogPanel() {
  const {
    selectedMemberId,
    logRows,
    loading,
    saving,
    selectMember,
    updateRow,
    addExercise,
    removeRow,
    saveAll,
  } = useQuickLog();

  const [members, setMembers] = useState<Member[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState('Other');
  const [exSearch, setExSearch] = useState('');
  const [showExDropdown, setShowExDropdown] = useState(false);

  const memberInputRef = useRef<HTMLInputElement>(null);
  const addExInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    membersApi.list({ active_only: true }).then(setMembers).catch(() => {});
    exercisesApi.list({ active_only: true }).then(setAllExercises).catch(() => {});
  }, []);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredExercises = allExercises.filter((e) =>
    e.name.toLowerCase().includes(exSearch.toLowerCase()) &&
    !logRows.some((r) => r.exercise_id === e.id)
  );

  const handleMemberSelect = (member: Member) => {
    setMemberSearch(member.name);
    setShowMemberDropdown(false);
    selectMember(member.id);
  };

  const handleAddExistingExercise = (ex: Exercise) => {
    setExSearch('');
    setShowExDropdown(false);
    addExercise(ex.name, ex.category);
  };

  const handleCreateAndAddExercise = async () => {
    if (!newExName.trim()) return;
    await addExercise(newExName.trim(), newExCategory);
    setNewExName('');
    setNewExCategory('Other');
    setShowAddExercise(false);
  };

  const handleSaveKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveAll();
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Log
        </h2>
        <span className="text-xs text-gray-400">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Member selector */}
      <div className="relative mb-4">
        <label className="label">Member</label>
        <input
          ref={memberInputRef}
          type="text"
          className="input"
          placeholder="Search member..."
          value={memberSearch}
          onChange={(e) => {
            setMemberSearch(e.target.value);
            setShowMemberDropdown(true);
            if (!e.target.value) selectMember(null);
          }}
          onFocus={() => setShowMemberDropdown(true)}
          onBlur={() => setTimeout(() => setShowMemberDropdown(false), 150)}
          autoComplete="off"
        />
        {showMemberDropdown && filteredMembers.length > 0 && (
          <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredMembers.map((m) => (
              <li
                key={m.id}
                onMouseDown={() => handleMemberSelect(m)}
                className={`px-3 py-2.5 cursor-pointer text-sm hover:bg-gray-50 flex items-center justify-between ${
                  m.id === selectedMemberId ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                }`}
              >
                <span>{m.name}</span>
                {m.last_session && (
                  <span className="text-xs text-gray-400">
                    Last: {new Date(m.last_session + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Exercise rows */}
      {selectedMemberId && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Spinner size="sm" />
              <span className="ml-2 text-sm text-gray-400">Loading exercises...</span>
            </div>
          ) : (
            <>
              {/* Column headers */}
              {logRows.length > 0 && (
                <div className="flex items-center gap-2 mb-1 px-0">
                  <div className="flex-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Exercise</div>
                  <div className="w-16 text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Sets</div>
                  <div className="w-16 text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Reps</div>
                  <div className="w-20 text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Weight</div>
                  <div className="w-6" />
                </div>
              )}

              <div className="max-h-64 overflow-y-auto">
                {logRows.map((row, idx) => (
                  <ExerciseLogRow
                    key={row.exercise_id}
                    row={row}
                    isLast={idx === logRows.length - 1}
                    onUpdate={(field, value) => updateRow(row.exercise_id, field as keyof LogRow, value)}
                    onRemove={() => removeRow(row.exercise_id)}
                    onTabLast={() => {
                      // Focus save button or add exercise
                    }}
                  />
                ))}
              </div>

              {logRows.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No exercises tracked yet. Add one below.
                </p>
              )}

              {/* Add exercise */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                {!showAddExercise ? (
                  <div className="flex gap-2">
                    {/* Search existing */}
                    <div className="flex-1 relative">
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
                        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {filteredExercises.slice(0, 8).map((ex) => (
                            <li
                              key={ex.id}
                              onMouseDown={() => handleAddExistingExercise(ex)}
                              className="px-3 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span>{ex.name}</span>
                              <span className="text-xs text-gray-400">{ex.category}</span>
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
                              className="px-3 py-2 cursor-pointer text-sm text-primary-600 hover:bg-primary-50 font-medium"
                            >
                              + Create "{exSearch}"
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">New exercise</p>
                    <input
                      ref={addExInputRef}
                      type="text"
                      className="input input-sm"
                      placeholder="Exercise name"
                      value={newExName}
                      onChange={(e) => setNewExName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAddExercise(); }}
                    />
                    <div className="flex gap-2">
                      <select
                        className="input input-sm flex-1"
                        value={newExCategory}
                        onChange={(e) => setNewExCategory(e.target.value)}
                      >
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <button className="btn-primary btn-sm" onClick={handleCreateAndAddExercise}>Add</button>
                      <button className="btn-secondary btn-sm" onClick={() => { setShowAddExercise(false); setNewExName(''); }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Save button */}
              <div className="mt-4">
                <button
                  className="btn-primary w-full"
                  onClick={saveAll}
                  onKeyDown={handleSaveKeyDown}
                  disabled={saving || logRows.length === 0}
                >
                  {saving ? (
                    <><Spinner size="sm" className="text-white" /> Saving...</>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save All
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {!selectedMemberId && (
        <p className="text-sm text-gray-400 text-center py-6">
          Select a member above to start logging
        </p>
      )}
    </div>
  );
}
