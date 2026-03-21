import { useState, useEffect } from 'react';
import { useQuickLog, type MemberSessionPayload } from './useQuickLog';
import MemberSection from './MemberSection';
import { membersApi } from '@/api/members';
import { exercisesApi } from '@/api/exercises';
import type { Member } from '@/types/member';
import type { Exercise } from '@/types/exercise';
import type { LogRow } from '@/types/sessionLog';
import Spinner from '@/components/ui/Spinner';

interface SectionData {
  id: string;
  memberId: number | null;
  logRows: LogRow[];
}

let _nextId = 1;
const newSectionId = () => `s${_nextId++}`;

export default function QuickLogPanel() {
  const { saving, loadMemberExercises, createExercise, saveAll } = useQuickLog();

  const [members, setMembers] = useState<Member[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sections, setSections] = useState<SectionData[]>([{ id: newSectionId(), memberId: null, logRows: [] }]);

  useEffect(() => {
    membersApi.list({ active_only: true }).then(setMembers).catch(() => {});
    exercisesApi.list({ active_only: true }).then(setAllExercises).catch(() => {});
  }, []);

  const handleDataChange = (sectionId: string, memberId: number | null, logRows: LogRow[]) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, memberId, logRows } : s))
    );
  };

  const addSection = () => {
    setSections((prev) => [...prev, { id: newSectionId(), memberId: null, logRows: [] }]);
  };

  const removeSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const handleSave = async () => {
    const payload: MemberSessionPayload[] = sections
      .filter((s) => s.memberId !== null)
      .map((s) => ({ memberId: s.memberId!, logRows: s.logRows }));

    const success = await saveAll(payload, logDate);
    if (success) {
      setSections([{ id: newSectionId(), memberId: null, logRows: [] }]);
      setLogDate(new Date().toISOString().split('T')[0]);
    }
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Log
        </h2>
        <input
          type="date"
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
        />
      </div>

      {/* Member sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <MemberSection
            key={section.id}
            sectionId={section.id}
            members={members}
            allExercises={allExercises}
            loadMemberExercises={loadMemberExercises}
            createExercise={createExercise}
            onDataChange={handleDataChange}
            onExerciseCreated={(ex) => setAllExercises((prev) => [...prev, ex])}
            onRemove={() => removeSection(section.id)}
            canRemove={sections.length > 1}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={addSection}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </button>

        <button
          className="btn-primary flex-1 py-2.5 text-base"
          onClick={handleSave}
          disabled={saving || sections.every((s) => s.memberId === null)}
        >
          {saving ? (
            <><Spinner size="sm" className="text-white" /> Saving...</>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Save Session
            </>
          )}
        </button>
      </div>
    </div>
  );
}
