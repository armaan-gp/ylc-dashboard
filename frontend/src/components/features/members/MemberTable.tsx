import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Member } from '@/types/member';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Props {
  members: Member[];
  onDeactivate: (id: number) => void;
  onEdit: (member: Member) => void;
  onReactivate: (id: number) => void;
}

export default function MemberTable({ members, onDeactivate, onEdit, onReactivate }: Props) {
  const navigate = useNavigate();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Joined</th>
              <th className="table-header">Last Session</th>
              <th className="table-header">Status</th>
              <th className="table-header w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr
                key={m.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/members/${m.id}`)}
              >
                <td className="table-cell font-medium text-gray-900">{m.name}</td>
                <td className="table-cell text-gray-500">
                  {new Date(m.join_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </td>
                <td className="table-cell text-gray-500">
                  {m.last_session
                    ? new Date(m.last_session + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="table-cell">
                  <span className={m.active ? 'badge-green' : 'badge-gray'}>
                    {m.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn-ghost btn-sm p-1.5"
                      onClick={() => onEdit(m)}
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {m.active ? (
                      <button
                        className="btn-ghost btn-sm p-1.5 text-red-400 hover:text-red-600"
                        onClick={() => setConfirmId(m.id)}
                        title="Deactivate"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        className="btn-ghost btn-sm p-1.5 text-green-500 hover:text-green-700"
                        onClick={() => onReactivate(m.id)}
                        title="Reactivate"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId) onDeactivate(confirmId); }}
        title="Deactivate Member"
        message="This will archive the member. Their session history will be preserved and they can be reactivated at any time."
        confirmLabel="Deactivate"
        danger
      />
    </>
  );
}
