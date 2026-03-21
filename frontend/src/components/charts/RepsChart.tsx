import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RepsDataPoint, RepsProjectionResult } from '@/types/analytics';

interface Props {
  data: RepsDataPoint[];
  projection?: RepsProjectionResult | null;
  exerciseName: string;
}

interface ChartPoint {
  date: string;
  reps?: number;
  proj?: number;
  is_pr?: boolean;
}

const formatDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const CustomDot = (props: { cx?: number; cy?: number; payload?: ChartPoint }) => {
  const { cx, cy, payload } = props;
  if (!payload?.is_pr || cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#16a34a" stroke="white" strokeWidth={2} />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#16a34a" fontSize={10} fontWeight={600}>PR</text>
    </g>
  );
};

export default function RepsChart({ data, projection }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No data available yet
      </div>
    );
  }

  const chartData: ChartPoint[] = data.map((d) => ({
    date: d.date,
    reps: d.reps,
    is_pr: d.is_pr,
  }));

  if (projection && !projection.insufficient_data) {
    const lastDate = new Date(data[data.length - 1].date + 'T00:00:00');
    const d4 = new Date(lastDate); d4.setDate(d4.getDate() + 28);
    const d8 = new Date(lastDate); d8.setDate(d8.getDate() + 56);

    chartData.push({
      date: data[data.length - 1].date,
      reps: data[data.length - 1].reps,
      proj: data[data.length - 1].reps,
    });
    chartData.push({
      date: d4.toISOString().split('T')[0],
      proj: projection.projected_4wk,
    });
    chartData.push({
      date: d8.toISOString().split('T')[0],
      proj: projection.projected_8wk,
    });
  }

  const allValues = chartData.flatMap((d) => [d.reps, d.proj].filter((v) => v != null) as number[]);
  const minVal = Math.max(0, Math.floor((Math.min(...allValues) - 2) / 1) * 1);
  const maxVal = Math.ceil((Math.max(...allValues) + 2) / 1) * 1;

  return (
    <div>
      {projection && !projection.insufficient_data && (
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
          <span>4-wk projection: <strong className="text-green-600">{projection.projected_4wk} reps</strong></span>
          <span>8-wk: <strong className="text-green-600">{projection.projected_8wk} reps</strong></span>
          {projection.r_squared < 0.4 && <span className="text-yellow-600">(low confidence)</span>}
        </div>
      )}
      {projection?.insufficient_data && (
        <p className="text-xs text-gray-400 mb-2">Need 3+ sessions for projection</p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[minVal, maxVal]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(val, name) => [
              `${val} reps`,
              name === 'reps' ? 'Max Reps' : 'Projection',
            ]}
            labelFormatter={(label) => formatDate(label)}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Line
            type="monotone"
            dataKey="reps"
            stroke="#16a34a"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 5 }}
            connectNulls={false}
            name="Max Reps"
          />
          {projection && !projection.insufficient_data && (
            <Line
              type="monotone"
              dataKey="proj"
              stroke="#86efac"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4 }}
              name="Projection"
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
