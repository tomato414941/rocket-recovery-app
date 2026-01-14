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
}: {
  icon: typeof Mountain;
  label: string;
  value: string | number;
  unit: string;
}) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
        <Icon size={14} />
        {label}
      </div>
      <div className="text-lg font-semibold text-gray-900">
        {value}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </div>
    </div>
  );
}

export function SimulationResults() {
  const { trajectoryResult } = useMissionStore();

  if (!trajectoryResult) {
    return (
      <div className="p-4 text-center text-gray-500">
        シミュレーションを実行してください
      </div>
    );
  }

  const { stats, predictedLanding, uncertaintyEllipse } = trajectoryResult;

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">シミュレーション結果</h3>

      {/* 主要統計 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          icon={Mountain}
          label="最高高度"
          value={stats.maxAltitude.toFixed(1)}
          unit="m"
        />
        <StatCard
          icon={Clock}
          label="飛行時間"
          value={stats.totalFlightTime.toFixed(1)}
          unit="s"
        />
        <StatCard
          icon={Gauge}
          label="最高速度"
          value={stats.maxVelocity.toFixed(1)}
          unit="m/s"
        />
        <StatCard
          icon={MapPin}
          label="飛行距離"
          value={stats.horizontalDistance.toFixed(0)}
          unit="m"
        />
        <StatCard
          icon={Compass}
          label="落下方位"
          value={stats.landingBearing.toFixed(0)}
          unit="°"
        />
        <StatCard
          icon={ArrowDown}
          label="着地速度"
          value={stats.landingVelocity.toFixed(1)}
          unit="m/s"
        />
      </div>

      {/* 予測落下地点 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-sm font-medium text-gray-700 mb-2">予測落下地点</div>
        <div className="text-sm text-gray-600 space-y-1">
          <div>緯度: {predictedLanding.latitude.toFixed(6)}°N</div>
          <div>経度: {predictedLanding.longitude.toFixed(6)}°E</div>
          <div className="text-gray-500 text-xs mt-2">
            予測誤差範囲: ±{uncertaintyEllipse.semiMajorAxis.toFixed(0)}m
            (95%信頼区間)
          </div>
        </div>
      </div>

      {/* フライトフェーズ */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-sm font-medium text-gray-700 mb-2">フライトフェーズ</div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>上昇</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span>頂点</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>降下</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>着地予測</span>
          </div>
        </div>
      </div>
    </div>
  );
}
