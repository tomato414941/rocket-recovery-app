/**
 * ライブテレメトリーグラフ
 * 予測値と実際の値を比較表示
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useMissionStore } from '../../store/missionStore';
import { TouchScrollWrapper } from '../shared/TouchScrollWrapper';

/**
 * 予測データポイント
 */
interface PredictedPoint {
  time: number;
  predictedAltitude: number;
  predictedVelocity: number;
}

/**
 * ライブデータポイント
 */
interface LivePoint {
  time: number;
  liveAltitude?: number;
  liveVelocity?: number;
}

/**
 * グラフデータポイント
 */
type ChartPoint = PredictedPoint & LivePoint;

export function LiveTelemetryChart() {
  const { trajectoryResult, telemetryHistory, telemetryStatus, launchSite } = useMissionStore();

  // 予測データを準備
  const predictedData = useMemo((): PredictedPoint[] => {
    if (!trajectoryResult) return [];

    return trajectoryResult.trajectoryPoints
      .filter((_, i) => i % 5 === 0) // 5ポイントごとにサンプル
      .map((point) => ({
        time: Math.round(point.time * 10) / 10,
        predictedAltitude: point.position.z - launchSite.elevation,
        predictedVelocity: Math.sqrt(
          point.velocity.x ** 2 +
          point.velocity.y ** 2 +
          point.velocity.z ** 2
        ),
      }));
  }, [trajectoryResult, launchSite.elevation]);

  // ライブデータを準備
  const liveData = useMemo((): LivePoint[] => {
    return telemetryHistory
      .filter((_, i) => i % 3 === 0) // 3ポイントごとにサンプル
      .map((data) => ({
        time: Math.round(
          ((data.timestamp.getTime() - telemetryHistory[0]?.timestamp.getTime()) / 1000) * 10
        ) / 10,
        liveAltitude: data.altitude,
        liveVelocity: data.velocity,
      }));
  }, [telemetryHistory]);

  // データを統合
  const chartData = useMemo((): ChartPoint[] => {
    const timeMap = new Map<number, ChartPoint>();

    // 予測データを追加
    for (const p of predictedData) {
      timeMap.set(p.time, { ...p, time: p.time });
    }

    // ライブデータを追加/マージ
    for (const l of liveData) {
      const existing = timeMap.get(l.time);
      if (existing) {
        existing.liveAltitude = l.liveAltitude;
        existing.liveVelocity = l.liveVelocity;
      } else {
        // 最も近い予測値を探す
        const nearest = predictedData.reduce((prev, curr) =>
          Math.abs(curr.time - l.time) < Math.abs(prev.time - l.time) ? curr : prev
        );
        timeMap.set(l.time, {
          time: l.time,
          predictedAltitude: nearest?.predictedAltitude ?? 0,
          predictedVelocity: nearest?.predictedVelocity ?? 0,
          liveAltitude: l.liveAltitude,
          liveVelocity: l.liveVelocity,
        });
      }
    }

    return Array.from(timeMap.values()).sort((a, b) => a.time - b.time);
  }, [predictedData, liveData]);

  // 現在の時刻
  const currentTime = liveData.length > 0 ? liveData[liveData.length - 1].time : 0;

  if (!trajectoryResult && telemetryHistory.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        シミュレーションを実行するとグラフが表示されます
      </div>
    );
  }

  return (
    <TouchScrollWrapper className="h-full p-2 bg-slate-800">
      {/* ライブインジケーター */}
      {telemetryStatus === 'running' && (
        <div className="absolute top-3 right-4 flex items-center gap-2 text-xs text-green-400 z-10">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          LIVE
        </div>
      )}

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
                predictedAltitude: '予測高度',
                predictedVelocity: '予測速度',
                liveAltitude: '実際高度',
                liveVelocity: '実際速度',
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
                predictedAltitude: '予測高度 (m)',
                predictedVelocity: '予測速度 (m/s)',
                liveAltitude: '実際高度 (m)',
                liveVelocity: '実際速度 (m/s)',
              };
              return <span style={{ color: '#94a3b8' }}>{labels[value] || value}</span>;
            }}
          />

          {/* 現在位置の垂直線 */}
          {telemetryStatus !== 'idle' && currentTime > 0 && (
            <ReferenceLine
              x={currentTime}
              yAxisId="left"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="3 3"
            />
          )}

          {/* 予測高度（点線） */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="predictedAltitude"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            opacity={0.6}
          />
          {/* 予測速度（点線） */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="predictedVelocity"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            opacity={0.6}
          />
          {/* 実際高度（実線） */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="liveAltitude"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {/* 実際速度（実線） */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="liveVelocity"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </TouchScrollWrapper>
  );
}
