/**
 * 飛行プロファイルグラフ
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useMissionStore } from '../../store/missionStore';

export function FlightChart() {
  const { trajectoryResult, launchSite } = useMissionStore();

  if (!trajectoryResult) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        シミュレーションを実行するとグラフが表示されます
      </div>
    );
  }

  // グラフ用データを準備
  const chartData = trajectoryResult.trajectoryPoints
    .filter((_, i) => i % 2 === 0)
    .map((point) => ({
      time: point.time.toFixed(1),
      altitude: point.position.z - launchSite.elevation,
      velocity: Math.sqrt(
        point.velocity.x ** 2 +
        point.velocity.y ** 2 +
        point.velocity.z ** 2
      ),
      distance: Math.sqrt(
        point.position.x ** 2 +
        point.position.y ** 2
      ),
    }));

  return (
    <div className="h-full p-2 bg-slate-800">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: '時間 (s)',
              position: 'insideBottom',
              offset: -5,
              fontSize: 11,
              fill: '#94a3b8',
            }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: '高度 (m)',
              angle: -90,
              position: 'insideLeft',
              fontSize: 11,
              fill: '#94a3b8',
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{
              value: '速度 (m/s)',
              angle: 90,
              position: 'insideRight',
              fontSize: 11,
              fill: '#94a3b8',
            }}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
              color: '#f8fafc',
            }}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                altitude: '高度',
                velocity: '速度',
                distance: '水平距離',
              };
              const numValue = typeof value === 'number' ? value.toFixed(1) : value;
              return [numValue, labels[String(name)] || name];
            }}
            labelFormatter={(label) => `${label} 秒`}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                altitude: '高度 (m)',
                velocity: '速度 (m/s)',
                distance: '水平距離 (m)',
              };
              return <span style={{ color: '#94a3b8' }}>{labels[value] || value}</span>;
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="altitude"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="velocity"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="distance"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
