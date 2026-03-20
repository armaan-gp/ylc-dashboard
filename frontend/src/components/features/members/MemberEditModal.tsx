import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { membersApi } from '@/api/members';
import type { Member } from '@/types/member';

interface Props {
  member: Member | null;
  onClose: () => void;
  onSuccess: (updated: Member) => void;
}

export default function MemberEditModal({ member, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setNotes(member.notes || '');
    }
  }, [member]);

  const handleSave = async () => {
    if (!member || !name.trim()) return;
    setSaving(true);
    try {
      const updated = await membersApi.update(member.id, { name: name.trim(), notes: notes || undefined });
      toast.success('Member updated');
      onSuccess(updated);
      onClose();
    } catch {
      toast.error('Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={!!member} onClose={onClose} title="Edit Member">
      <div className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            autoFocus
          />
        </div>
        <div>
          <label className="label">Officer Notes (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Any notes about this member..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button className="btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
