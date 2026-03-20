import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import MemberTable from '@/components/features/members/MemberTable';
import MemberAddForm from '@/components/features/members/MemberAddForm';
import MemberEditModal from '@/components/features/members/MemberEditModal';
import { membersApi } from '@/api/members';
import type { Member } from '@/types/member';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const fetchMembers = () => {
    setLoading(true);
    membersApi
      .list({ active_only: false })
      .then(setMembers)
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleDeactivate = async (id: number) => {
    try {
      await membersApi.deactivate(id);
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, active: false } : m)));
      toast.success('Member deactivated');
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      const updated = await membersApi.update(id, { active: true });
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      toast.success('Member reactivated');
    } catch {
      toast.error('Failed to reactivate');
    }
  };

  const handleEditSuccess = (updated: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const filtered = members
    .filter((m) => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchesActive = showInactive ? true : m.active;
      return matchesSearch && matchesActive;
    })
    .sort((a, b) => {
      const lastA = a.name.split(' ').pop()!.toLowerCase();
      const lastB = b.name.split(' ').pop()!.toLowerCase();
      return lastA.localeCompare(lastB);
    });

  const activeCount = members.filter((m) => m.active).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeCount} active member{activeCount !== 1 ? 's' : ''}</p>
        </div>
        <button
          className="btn-primary btn-sm"
          onClick={() => setShowAdd((v) => !v)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Members
        </button>
      </div>

      {showAdd && (
        <MemberAddForm
          onSuccess={(created: Member[]) => {
            setMembers((prev) => [...created, ...prev]);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          className="input max-w-xs"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No members match your search' : 'No members yet'}
            description={search ? 'Try a different search term' : 'Add your first member using the button above'}
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        ) : (
          <MemberTable
            members={filtered}
            onDeactivate={handleDeactivate}
            onEdit={setEditMember}
            onReactivate={handleReactivate}
          />
        )}
      </div>

      <MemberEditModal
        member={editMember}
        onClose={() => setEditMember(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
