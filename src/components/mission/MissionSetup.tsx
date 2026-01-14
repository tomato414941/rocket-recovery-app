/**
 * ミッション設定パネル
 */

import { useMissionStore } from '../../store/missionStore';
import { RocketParameters } from './RocketParameters';
import { RecoverySettings } from './RecoverySettings';
import { LaunchSiteSettings } from './LaunchSiteSettings';
import { WeatherSettings } from './WeatherSettings';
import { Play, RotateCcw } from 'lucide-react';

export function MissionSetup() {
  const {
    runSimulation,
    resetToDefaults,
    isCalculating,
    calculationError,
  } = useMissionStore();

  return (
    <div className="p-4 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">ミッション設定</h2>
        <button
          onClick={resetToDefaults}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RotateCcw size={14} />
          リセット
        </button>
      </div>

      {/* 発射地点 */}
      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-3">発射地点</h3>
        <LaunchSiteSettings />
      </section>

      {/* ロケットパラメータ */}
      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-3">ロケット</h3>
        <RocketParameters />
      </section>

      {/* 回収設定 */}
      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-3">回収方式</h3>
        <RecoverySettings />
      </section>

      {/* 気象設定 */}
      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-3">気象データ</h3>
        <WeatherSettings />
      </section>

      {/* エラー表示 */}
      {calculationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {calculationError}
        </div>
      )}

      {/* シミュレーション実行ボタン */}
      <button
        onClick={runSimulation}
        disabled={isCalculating}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        {isCalculating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            計算中...
          </>
        ) : (
          <>
            <Play size={18} />
            シミュレーション実行
          </>
        )}
      </button>
    </div>
  );
}
