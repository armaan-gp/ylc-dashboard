import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { membersApi } from '@/api/members';
import { logsApi } from '@/api/sessionLogs';
import { analyticsApi } from '@/api/analytics';
import type { Member, MemberExerciseLastLog } from '@/types/member';
import type { SessionLog, SessionLogUpdate } from '@/types/sessionLog';
import type {
  E1RMDataPoint,
  VolumeDataPoint,
  ProjectionResult,
  PlateauResult,
  Recommendation,
} from '@/types/analytics';
import E1RMChart from '@/components/charts/E1RMChart';
import VolumeChart from '@/components/charts/VolumeChart';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

const severityColors: Record<string, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  success: 'bg-green-50 border-green-200 text-green-800',
};

const severityIcons: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
};

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const memberId = parseInt(id!);
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [exercises, setExercises] = useState<MemberExerciseLastLog[]>([]);
  const [selectedExId, setSelectedExId] = useState<number | null>(null);
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [e1rmData, setE1rmData] = useState<E1RMDataPoint[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [projections, setProjections] = useState<ProjectionResult[]>([]);
  const [plateaus, setPlateaus] = useState<PlateauResult[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLog, setEditLog] = useState<SessionLog | null>(null);
  const [deleteLogId, setDeleteLogId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SessionLogUpdate>({});

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);

    Promise.all([
      membersApi.get(memberId),
      membersApi.getExercises(memberId),
      logsApi.list({ member_id: memberId }),
      analyticsApi.memberE1RM(memberId),
      analyticsApi.memberVolume(memberId),
      analyticsApi.memberProjection(memberId),
      analyticsApi.memberPlateau(memberId),
      analyticsApi.memberRecommendations(memberId),
    ])
      .then(([m, exs, ls, e1rm, vol, proj, plat, recs]) => {
        setMember(m as Member);
        const exsList = exs as MemberExerciseLastLog[];
        setExercises(exsList);
        if (exsList.length > 0 && !selectedExId) {
          setSelectedExId(exsList[0].exercise_id);
        }
        setLogs(ls as SessionLog[]);
        setE1rmData(e1rm as E1RMDataPoint[]);
        setVolumeData(vol as VolumeDataPoint[]);
        setProjections(proj as ProjectionResult[]);
        setPlateaus(plat as PlateauResult[]);
        setRecommendations(recs as Recommendation[]);
      })
      .catch(() => toast.error('Failed to load member data'))
      .finally(() => setLoading(false));
  }, [memberId]);

  const selectedExercise = exercises.find((e) => e.exercise_id === selectedExId);
  const filteredE1rm = selectedExId
    ? e1rmData.filter((d) => d.exercise_name === selectedExercise?.exercise_name)
    : e1rmData;
  const filteredVolume = selectedExId
    ? volumeData.filter((d) => d.exercise_name === selectedExercise?.exercise_name)
    : volumeData;
  const selectedProjection = projections.find((p) => p.exercise_id === selectedExId);
  const selectedPlateau = plateaus.find((p) => p.exercise_id === selectedExId);

  const filteredLogs = selectedExId
    ? logs.filter((l) => l.exercise_id === selectedExId)
    : logs;

  const handleDeleteLog = async () => {
    if (!deleteLogId) return;
    try {
      await logsApi.delete(deleteLogId);
      setLogs((prev) => prev.filter((l) => l.id !== deleteLogId));
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleEditLog = async () => {
    if (!editLog) return;
    try {
      const updated = await logsApi.update(editLog.id, editForm);
      setLogs((prev) => prev.map((l) => (l.id === editLog.id ? updated : l)));
      setEditLog(null);
      toast.success('Entry updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!member) {
    return (
      <EmptyState
        title="Member not found"
        action={<button className="btn-secondary btn-sm" onClick={() => navigate('/members')}>Back to Members</button>}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            onClick={() => navigate('/members')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{member.name}</h1>
              <span className={member.active ? 'badge-green' : 'badge-gray'}>
                {member.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Joined {new Date(member.join_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {' · '}{member.session_count} sessions
              {member.last_session && (
                <> · Last session {new Date(member.last_session + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: charts */}
        <div className="lg:col-span-2 space-y-5">
          {/* Exercise selector */}
          {exercises.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {exercises.map((ex) => {
                const isPlateau = plateaus.find((p) => p.exercise_id === ex.exercise_id)?.is_plateau;
                return (
                  <button
                    key={ex.exercise_id}
                    onClick={() => setSelectedExId(ex.exercise_id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedExId === ex.exercise_id
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {ex.exercise_name}
                    {isPlateau && (
                      <span title="Plateau detected" className="text-yellow-400 text-xs">⚠</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* e1RM Chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Estimated 1RM
                {selectedExercise && (
                  <span className="text-gray-400 font-normal ml-1">— {selectedExercise.exercise_name}</span>
                )}
              </h3>
              {selectedPlateau?.is_plateau && (
                <span className="badge-yellow flex items-center gap-1">
                  ⚠ Plateau
                </span>
              )}
              {selectedExercise?.last_e1rm && (
                <span className="text-sm text-gray-500">
                  Current: <strong className="text-gray-900">{selectedExercise.last_e1rm} lbs</strong>
                </span>
              )}
            </div>
            <E1RMChart
              data={filteredE1rm}
              projection={selectedProjection}
              exerciseName={selectedExercise?.exercise_name || ''}
            />
          </div>

          {/* Volume Chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Volume
              {selectedExercise && (
                <span className="text-gray-400 font-normal ml-1">— {selectedExercise.exercise_name}</span>
              )}
            </h3>
            <VolumeChart data={filteredVolume} />
          </div>

          {/* Session History */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Session History</h3>
              <span className="text-xs text-gray-400">{filteredLogs.length} entries</span>
            </div>
            {filteredLogs.length === 0 ? (
              <EmptyState title="No sessions logged yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="table-header">Date</th>
                      <th className="table-header">Exercise</th>
                      <th className="table-header">Sets</th>
                      <th className="table-header">Reps</th>
                      <th className="table-header">Weight</th>
                      <th className="table-header">e1RM</th>
                      <th className="table-header w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLogs.slice(0, 50).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="table-cell text-gray-500">
                          {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="table-cell font-medium">{log.exercise_name}</td>
                        <td className="table-cell">{log.sets}</td>
                        <td className="table-cell">{log.reps}</td>
                        <td className="table-cell">{log.weight_lbs} lbs</td>
                        <td className="table-cell text-primary-600 font-medium">{log.e1rm}</td>
                        <td className="table-cell">
                          <div className="flex gap-1">
                            <button
                              className="btn-ghost btn-sm p-1"
                              onClick={() => { setEditLog(log); setEditForm({ sets: log.sets, reps: log.reps, weight_lbs: log.weight_lbs, notes: log.notes || '' }); }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              className="btn-ghost btn-sm p-1 text-red-400 hover:text-red-600"
                              onClick={() => setDeleteLogId(log.id)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: recommendations */}
        <div className="space-y-5">
          {/* Recommendations */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Recommendations
            </h3>
            {recommendations.length === 0 ? (
              <p className="text-sm text-gray-400">Log more sessions to get personalized tips</p>
            ) : (
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border text-xs leading-relaxed ${severityColors[rec.severity]}`}
                  >
                    <span className="mr-1">{severityIcons[rec.severity]}</span>
                    {rec.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {member.notes && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Officer Notes</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{member.notes}</p>
            </div>
          )}

          {/* Current lifts */}
          {exercises.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Current Lifts</h3>
              <div className="space-y-2">
                {exercises.map((ex) => (
                  <div key={ex.exercise_id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{ex.exercise_name}</span>
                    <span className="font-medium text-gray-900">
                      {ex.last_e1rm ? `${ex.last_e1rm} lbs` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit log modal */}
      <Modal isOpen={!!editLog} onClose={() => setEditLog(null)} title="Edit Entry">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Sets</label>
              <input type="number" className="input" value={editForm.sets ?? ''} onChange={(e) => setEditForm((f: SessionLogUpdate) => ({ ...f, sets: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Reps</label>
              <input type="number" className="input" value={editForm.reps ?? ''} onChange={(e) => setEditForm((f: SessionLogUpdate) => ({ ...f, reps: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Weight (lbs)</label>
              <input type="number" className="input" value={editForm.weight_lbs ?? ''} onChange={(e) => setEditForm((f: SessionLogUpdate) => ({ ...f, weight_lbs: parseFloat(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input type="text" className="input" value={editForm.notes ?? ''} onChange={(e) => setEditForm((f: SessionLogUpdate) => ({ ...f, notes: e.target.value }))} placeholder="Optional note..." />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-secondary btn-sm" onClick={() => setEditLog(null)}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={handleEditLog}>Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteLogId !== null}
        onClose={() => setDeleteLogId(null)}
        onConfirm={handleDeleteLog}
        title="Delete Entry"
        message="This will permanently delete this session log entry."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
