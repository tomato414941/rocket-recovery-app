/**
 * シミュレーション結果サマリー
 */

import { useMissionStore } from '../../store/missionStore';
import {
  Mountain,
  Clock,
  Gauge,
  MapPin,
  Compass,
  ArrowDown,
} from 'lucide-react';

/**
 * 統計表示カード
 */
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color = 'text-blue-400',
}: {
  icon: typeof Mountain;
  label: string;
  value: string | number;
  unit: string;
  color?: string;
}) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
        <Icon size={14} className={color} />
        {label}
      </div>
      <div className="text-lg font-semibold text-slate-50">
        {value}
        <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
      </div>
    </div>
  );
}

export function SimulationResults() {
  const { trajectoryResult } = useMissionStore();

  if (!trajectoryResult) {
    return (
      <div className="p-4 text-center text-slate-500">
        シミュレーションを実行してください
      </div>
    );
  }

  const { stats, predictedLanding, uncertaintyEllipse } = trajectoryResult;

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-slate-50">シミュレーション結果</h3>

      {/* 主要統計 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          icon={Mountain}
          label="最高高度"
          value={stats.maxAltitude.toFixed(1)}
          unit="m"
          color="text-amber-400"
        />
        <StatCard
          icon={Clock}
          label="飛行時間"
          value={stats.totalFlightTime.toFixed(1)}
          unit="s"
          color="text-green-400"
        />
        <StatCard
          icon={Gauge}
          label="最高速度"
          value={stats.maxVelocity.toFixed(1)}
          unit="m/s"
          color="text-red-400"
        />
        <StatCard
          icon={MapPin}
          label="飛行距離"
          value={stats.horizontalDistance.toFixed(0)}
          unit="m"
          color="text-blue-400"
        />
        <StatCard
          icon={Compass}
          label="落下方位"
          value={stats.landingBearing.toFixed(0)}
          unit="°"
          color="text-purple-400"
        />
        <StatCard
          icon={ArrowDown}
          label="着地速度"
          value={stats.landingVelocity.toFixed(1)}
          unit="m/s"
          color="text-orange-400"
        />
      </div>

      {/* 予測落下地点 */}
      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
        <div className="text-sm font-medium text-slate-300 mb-2">予測落下地点</div>
        <div className="text-sm text-slate-400 space-y-1">
          <div>緯度: <span className="text-slate-200">{predictedLanding.latitude.toFixed(6)}°N</span></div>
          <div>経度: <span className="text-slate-200">{predictedLanding.longitude.toFixed(6)}°E</span></div>
          <div className="text-slate-500 text-xs mt-2">
            予測誤差範囲: ±{uncertaintyEllipse.semiMajorAxis.toFixed(0)}m
            (95%信頼区間)
          </div>
        </div>
      </div>

      {/* フライトフェーズ */}
      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
        <div className="text-sm font-medium text-slate-300 mb-2">フライトフェーズ</div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded shadow-lg shadow-blue-500/50" />
            <span className="text-slate-400">上昇</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded shadow-lg shadow-amber-500/50" />
            <span className="text-slate-400">頂点</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded shadow-lg shadow-green-500/50" />
            <span className="text-slate-400">降下</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded shadow-lg shadow-red-500/50" />
            <span className="text-slate-400">着地予測</span>
          </div>
        </div>
      </div>
    </div>
  );
}
