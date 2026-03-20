import { useNavigate } from 'react-router-dom';
import type { SessionLog } from '@/types/sessionLog';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

interface Props {
  logs: SessionLog[];
  loading: boolean;
}

export default function RecentActivity({ logs, loading }: Props) {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          title="No sessions logged yet"
          description="Log your first session using the Quick Log panel."
          icon={
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
      ) : (
        <ul className="divide-y divide-gray-100">
          {logs.map((log) => (
            <li
              key={log.id}
              className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/members/${log.member_id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">{log.member_name}</span>
                  <span className="text-gray-400 mx-1.5 text-sm">·</span>
                  <span className="text-sm text-gray-600">{log.exercise_name}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {log.reps} reps @ {log.weight_lbs} lbs
                <span className="ml-1.5 text-primary-500">e1RM {log.e1rm} lbs</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
