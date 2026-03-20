import type { ClubStats } from '@/types/analytics';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function StatCard({ label, value, sub, color = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

interface Props {
  stats: ClubStats | null;
  loading: boolean;
}

export default function ClubStatsCard({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-7 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <StatCard
        label="Active Members"
        value={stats.active_members}
        sub={`${stats.total_members} total`}
        color="text-primary-600"
      />
      <StatCard
        label="Sessions This Week"
        value={stats.sessions_this_week}
        sub={`${stats.sessions_this_month} this month`}
      />
      <StatCard
        label="Total Sessions"
        value={stats.total_sessions}
      />
      {stats.most_active_member_name && (
        <StatCard
          label="Most Active"
          value={stats.most_active_member_name}
          color="text-green-700"
        />
      )}
      {stats.top_exercise_name && (
        <StatCard
          label="Top Exercise"
          value={stats.top_exercise_name}
        />
      )}
    </div>
  );
}
