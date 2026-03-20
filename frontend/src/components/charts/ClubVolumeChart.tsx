import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WeeklyVolume } from '@/types/analytics';

interface Props {
  data: WeeklyVolume[];
}

const formatDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function ClubVolumeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="week_start"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(val) => [val, 'Sessions']}
          labelFormatter={(l) => `Week of ${formatDate(l)}`}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Line
          type="monotone"
          dataKey="session_count"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
