import { useEffect, useState } from 'react';
import QuickLogPanel from '@/components/features/quick-log/QuickLogPanel';
import ClubStatsCard from '@/components/features/analytics/ClubStatsCard';
import NeedsAttentionList from '@/components/features/analytics/NeedsAttentionList';
import RecentActivity from '@/components/features/analytics/RecentActivity';
import { analyticsApi } from '@/api/analytics';
import { logsApi } from '@/api/sessionLogs';
import type { ClubStats, NeedsAttentionMember } from '@/types/analytics';
import type { SessionLog } from '@/types/sessionLog';

export default function DashboardPage() {
  const [stats, setStats] = useState<ClubStats | null>(null);
  const [attention, setAttention] = useState<NeedsAttentionMember[]>([]);
  const [recent, setRecent] = useState<SessionLog[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [attentionLoading, setAttentionLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);

  const fetchAll = () => {
    analyticsApi.clubStats().then(setStats).catch(() => {}).finally(() => setStatsLoading(false));
    analyticsApi.needsAttention().then(setAttention).catch(() => {}).finally(() => setAttentionLoading(false));
    logsApi.recent(15).then(setRecent).catch(() => {}).finally(() => setRecentLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">Dashboard</h1>

      {/* Stats row */}
      <div className="mb-5">
        <ClubStatsCard stats={stats} loading={statsLoading} />
      </div>

      {/* Quick Log – full width, primary feature */}
      <div className="mb-5">
        <QuickLogPanel />
      </div>

      {/* Secondary widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <NeedsAttentionList members={attention} loading={attentionLoading} />
        <RecentActivity logs={recent} loading={recentLoading} />
      </div>
    </div>
  );
}
