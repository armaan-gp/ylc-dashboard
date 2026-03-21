import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '@/api/analytics';
import ClubVolumeChart from '@/components/charts/ClubVolumeChart';
import type { WeeklyVolume, TopPerformer, TopRepGainer } from '@/types/analytics';
import Spinner from '@/components/ui/Spinner';

type PresetId = '30d' | 'this_month' | '3m' | '6m' | 'this_year' | '1y' | 'all_time' | 'custom';

interface Preset { id: PresetId; label: string; }
const PRESETS: Preset[] = [
  { id: 'this_month', label: 'This Month' },
  { id: '30d',        label: '30 Days'    },
  { id: '3m',         label: '3 Months'   },
  { id: '6m',         label: '6 Months'   },
  { id: 'this_year',  label: 'This Year'  },
  { id: '1y',         label: '1 Year'     },
  { id: 'all_time',   label: 'All Time'   },
  { id: 'custom',     label: 'Custom'     },
];

function getPresetDates(id: PresetId): { date_from?: string; date_to?: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };
  switch (id) {
    case 'this_month': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { date_from: fmt(from), date_to: fmt(today) };
    }
    case '30d':       return { date_from: fmt(daysAgo(30)),  date_to: fmt(today) };
    case '3m':        return { date_from: fmt(daysAgo(90)),  date_to: fmt(today) };
    case '6m':        return { date_from: fmt(daysAgo(180)), date_to: fmt(today) };
    case 'this_year': {
      const from = new Date(today.getFullYear(), 0, 1);
      return { date_from: fmt(from), date_to: fmt(today) };
    }
    case '1y':        return { date_from: fmt(daysAgo(365)), date_to: fmt(today) };
    case 'all_time':  return {};
    default:          return {};
  }
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolume[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [topRepGainers, setTopRepGainers] = useState<TopRepGainer[]>([]);
  const [volumeLoading, setVolumeLoading] = useState(true);
  const [topLoading, setTopLoading] = useState(true);

  const [preset, setPreset] = useState<PresetId>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchTop = useCallback((params: { date_from?: string; date_to?: string }) => {
    setTopLoading(true);
    Promise.all([
      analyticsApi.topPerformers(params),
      analyticsApi.topRepGainers(params),
    ])
      .then(([performers, repGainers]) => {
        setTopPerformers(performers);
        setTopRepGainers(repGainers);
      })
      .finally(() => setTopLoading(false));
  }, []);

  // Initial load
  useEffect(() => {
    analyticsApi.clubVolume()
      .then(setWeeklyVolume)
      .finally(() => setVolumeLoading(false));
    fetchTop(getPresetDates('this_month'));
  }, []);

  const handlePreset = (id: PresetId) => {
    setPreset(id);
    if (id !== 'custom') fetchTop(getPresetDates(id));
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) fetchTop({ date_from: customFrom, date_to: customTo });
  };

  const rangeLabel = () => {
    if (preset === 'custom' && customFrom && customTo)
      return `${customFrom} – ${customTo}`;
    return PRESETS.find((p) => p.id === preset)?.label ?? '';
  };

  if (volumeLoading) {
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
        {/* Weekly Sessions Chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Weekly Sessions</h2>
          <ClubVolumeChart data={weeklyVolume} />
        </div>

        {/* Top Performers */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Top Performers</h2>
                <p className="text-xs text-gray-400 mt-0.5">Ranked by % e1RM gain — {rangeLabel()}</p>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePreset(p.id)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      preset === p.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom date range inputs */}
            {preset === 'custom' && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="date"
                  className="input input-sm"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="date"
                  className="input input-sm"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
                <button
                  className="btn-primary btn-sm"
                  onClick={handleCustomApply}
                  disabled={!customFrom || !customTo}
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {topLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner size="sm" />
            </div>
          ) : topPerformers.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No performance data for this period. Log sessions to see top performers.
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
        {/* Top Rep Gainers */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Top Rep Gainers</h2>
            <p className="text-xs text-gray-400 mt-0.5">Bodyweight exercises — ranked by % rep gain — {rangeLabel()}</p>
          </div>

          {topLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner size="sm" />
            </div>
          ) : topRepGainers.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No bodyweight rep data for this period. Log sessions with weight set to 0 to track rep growth.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header w-8">#</th>
                  <th className="table-header">Member</th>
                  <th className="table-header">Exercise</th>
                  <th className="table-header">Rep Gain</th>
                  <th className="table-header">Current Reps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topRepGainers.map((g, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/members/${g.member_id}`)}
                  >
                    <td className="table-cell text-gray-400 font-medium">{i + 1}</td>
                    <td className="table-cell font-medium text-gray-900">{g.member_name}</td>
                    <td className="table-cell text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        {g.exercise_name}
                        <span className="text-xs text-green-600 font-medium">BW</span>
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="badge-green">+{g.reps_gain_pct}%</span>
                    </td>
                    <td className="table-cell text-green-600 font-medium">{g.current_reps} reps</td>
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
