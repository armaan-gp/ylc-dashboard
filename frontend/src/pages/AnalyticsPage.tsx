import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '@/api/analytics';
import ClubVolumeChart from '@/components/charts/ClubVolumeChart';
import type { WeeklyVolume, TopPerformer } from '@/types/analytics';
import Spinner from '@/components/ui/Spinner';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolume[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.clubVolume(),
      analyticsApi.topPerformers(),
    ])
      .then(([vol, top]) => {
        setWeeklyVolume(vol);
        setTopPerformers(top);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">Club Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Club Volume Chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Weekly Club Volume & Sessions</h2>
          <ClubVolumeChart data={weeklyVolume} />
        </div>

        {/* Top Performers */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">
              Top Performers This Month
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Ranked by % e1RM gain vs. last month</p>
          </div>
          {topPerformers.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No performance data for this month yet. Log sessions to see top performers.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header w-8">#</th>
                  <th className="table-header">Member</th>
                  <th className="table-header">Exercise</th>
                  <th className="table-header">e1RM Gain</th>
                  <th className="table-header">Current e1RM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topPerformers.map((p, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/members/${p.member_id}`)}
                  >
                    <td className="table-cell text-gray-400 font-medium">{i + 1}</td>
                    <td className="table-cell font-medium text-gray-900">{p.member_name}</td>
                    <td className="table-cell text-gray-500">{p.exercise_name}</td>
                    <td className="table-cell">
                      <span className="badge-green">+{p.e1rm_gain_pct}%</span>
                    </td>
                    <td className="table-cell text-primary-600 font-medium">{p.current_e1rm} lbs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
