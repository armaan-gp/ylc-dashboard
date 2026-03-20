import { useNavigate } from 'react-router-dom';
import type { NeedsAttentionMember } from '@/types/analytics';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

interface Props {
  members: NeedsAttentionMember[];
  loading: boolean;
}

export default function NeedsAttentionList({ members, loading }: Props) {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Needs Attention
          {members.length > 0 && (
            <span className="ml-auto badge-yellow">{members.length}</span>
          )}
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          title="All members are on track"
          description="No one needs attention right now."
          icon={
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <ul className="divide-y divide-gray-100">
          {members.map((m) => (
            <li
              key={m.id}
              className="px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => navigate(`/members/${m.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <ul className="mt-0.5 space-y-0.5">
                    {m.reasons.map((r: string, i: number) => (
                      <li key={i} className="text-xs text-gray-500">{r}</li>
                    ))}
                  </ul>
                </div>
                <svg className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
