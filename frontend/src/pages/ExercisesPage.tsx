import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { exercisesApi } from '@/api/exercises';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import type { Exercise } from '@/types/exercise';


export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchExercises = () => {
    setLoading(true);
    exercisesApi.list().then(setExercises).finally(() => setLoading(false));
  };

  useEffect(() => { fetchExercises(); }, []);

  useEffect(() => {
    if (editExercise) {
      setEditName(editExercise.name);
      setEditDesc(editExercise.description || '');
    }
  }, [editExercise]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await exercisesApi.create({ name: newName.trim(), category: 'Other', description: newDesc || undefined });
      setExercises((prev) => [created, ...prev]);
      setNewName(''); setNewDesc('');
      setShowAdd(false);
      toast.success('Exercise created');
    } catch {
      toast.error('Failed to create exercise');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editExercise || !editName.trim()) return;
    setSaving(true);
    try {
      const updated = await exercisesApi.update(editExercise.id, { name: editName.trim(), description: editDesc || undefined });
      setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditExercise(null);
      toast.success('Exercise updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (ex: Exercise) => {
    try {
      const updated = await exercisesApi.update(ex.id, { active: !ex.active });
      setExercises((prev) => prev.map((e) => (e.id === ex.id ? updated : e)));
      toast.success(updated.active ? 'Exercise reactivated' : 'Exercise deactivated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await exercisesApi.delete(deleteId);
      setExercises((prev) => prev.filter((e) => e.id !== deleteId));
      toast.success('Exercise removed');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = exercises.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchActive = showInactive ? true : e.active;
    return matchSearch && matchActive;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Exercise Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">{exercises.filter((e) => e.active).length} active exercises</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Exercise
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input type="text" className="input max-w-xs" placeholder="Search exercises..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No exercises found"
            description={search ? 'Try a different search term' : 'Create your first exercise above'}
            icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h2m0 0V4m0 2v2M7 6h10m0 0V4m0 2v2m2 0h2m0 0V4m0 2v2M5 12h14" /></svg>}
          />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Usage</th>
                <th className="table-header">Status</th>
                <th className="table-header w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((ex) => (
                <tr key={ex.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-gray-900">{ex.name}</p>
                      {ex.description && <p className="text-xs text-gray-400 mt-0.5">{ex.description}</p>}
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">{ex.usage_count} logs</td>
                  <td className="table-cell"><span className={ex.active ? 'badge-green' : 'badge-gray'}>{ex.active ? 'Active' : 'Inactive'}</span></td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button className="btn-ghost btn-sm p-1.5" onClick={() => setEditExercise(ex)} title="Edit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button className={`btn-ghost btn-sm p-1.5 ${ex.active ? 'text-yellow-500 hover:text-yellow-700' : 'text-green-500 hover:text-green-700'}`} onClick={() => handleToggleActive(ex)} title={ex.active ? 'Deactivate' : 'Reactivate'}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={ex.active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} /></svg>
                      </button>
                      {ex.usage_count === 0 && (
                        <button className="btn-ghost btn-sm p-1.5 text-red-400 hover:text-red-600" onClick={() => setDeleteId(ex.id)} title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Exercise">
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input type="text" className="input" placeholder="e.g. Bench Press" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }} autoFocus />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input type="text" className="input" placeholder="Short description..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={handleCreate} disabled={saving || !newName.trim()}>
              {saving ? 'Creating...' : 'Create Exercise'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editExercise} onClose={() => setEditExercise(null)} title="Edit Exercise">
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input type="text" className="input" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <input type="text" className="input" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-secondary btn-sm" onClick={() => setEditExercise(null)}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={handleEdit} disabled={saving || !editName.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Exercise"
        message="This will permanently delete this exercise. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
