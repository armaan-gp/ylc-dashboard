import { useState } from 'react';
import toast from 'react-hot-toast';
import { membersApi } from '@/api/members';
import type { Member } from '@/types/member';

interface MemberRow {
  name: string;
  join_date: string;
}

interface Props {
  onSuccess: (members: Member[]) => void;
  onCancel: () => void;
}

export default function MemberAddForm({ onSuccess, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [rows, setRows] = useState<MemberRow[]>([{ name: '', join_date: today }]);
  const [saving, setSaving] = useState(false);

  const addRow = () => setRows((prev) => [...prev, { name: '', join_date: today }]);

  const updateRow = (idx: number, field: keyof MemberRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const removeRow = (idx: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const valid = rows.filter((r) => r.name.trim());
    if (valid.length === 0) {
      toast.error('Enter at least one member name');
      return;
    }
    setSaving(true);
    try {
      const created = await membersApi.create(
        valid.map((r) => ({ name: r.name.trim(), join_date: r.join_date || undefined }))
      );
      toast.success(`Added ${created.length} member${created.length > 1 ? 's' : ''}`);
      onSuccess(created);
    } catch {
      toast.error('Failed to add members');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 mb-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Add New Members</h3>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              type="text"
              className="input flex-1"
              placeholder="Full name"
              value={row.name}
              onChange={(e) => updateRow(idx, 'name', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addRow(); }}
              autoFocus={idx === 0}
            />
            <input
              type="date"
              className="input w-36"
              value={row.join_date}
              onChange={(e) => updateRow(idx, 'join_date', e.target.value)}
            />
            {rows.length > 1 && (
              <button
                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                onClick={() => removeRow(idx)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button className="btn-ghost btn-sm text-primary-600" onClick={addRow}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Another
        </button>
        <div className="flex-1" />
        <button className="btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : `Save ${rows.filter((r) => r.name.trim()).length || ''} Member${rows.filter(r => r.name.trim()).length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}
