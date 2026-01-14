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
      <div className="h-full flex items-center justify-center text-gray-400">
        シミュレーションを実行するとグラフが表示されます
      </div>
    );
  }

  // グラフ用データを準備
  const chartData = trajectoryResult.trajectoryPoints
    .filter((_, i) => i % 2 === 0) // 間引いて表示
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
    <div className="h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11 }}
            label={{
              value: '時間 (s)',
              position: 'insideBottom',
              offset: -5,
              fontSize: 11,
            }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11 }}
            label={{
              value: '高度 (m)',
              angle: -90,
              position: 'insideLeft',
              fontSize: 11,
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11 }}
            label={{
              value: '速度 (m/s)',
              angle: 90,
              position: 'insideRight',
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
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
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                altitude: '高度 (m)',
                velocity: '速度 (m/s)',
                distance: '水平距離 (m)',
              };
              return labels[value] || value;
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="altitude"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="velocity"
            stroke="#dc2626"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="distance"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
