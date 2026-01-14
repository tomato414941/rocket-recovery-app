/**
 * 回収方式設定
 */

import { useMissionStore } from '../../store/missionStore';
import type { RecoveryMethod } from '../../types/recovery';
import { RECOVERY_METHOD_LABELS } from '../../types/recovery';

export function RecoverySettings() {
  const { recoveryParams, setRecoveryParams } = useMissionStore();

  const methods: RecoveryMethod[] = ['parachute', 'streamer', 'freefall'];

  return (
    <div className="space-y-3 bg-slate-700/50 p-3 rounded-lg">
      {/* 回収方式選択 */}
      <div className="flex gap-2">
        {methods.map((method) => (
          <button
            key={method}
            onClick={() => setRecoveryParams({ method })}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              recoveryParams.method === method
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-600 border border-slate-500 text-slate-300 hover:bg-slate-500'
            }`}
          >
            {RECOVERY_METHOD_LABELS[method]}
          </button>
        ))}
      </div>

      {/* パラシュート設定 */}
      {recoveryParams.method === 'parachute' && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <label className="flex-1 text-sm text-slate-400">パラシュート直径</label>
            <input
              type="number"
              value={(recoveryParams.parachuteDiameter ?? 0.3) * 100}
              onChange={(e) =>
                setRecoveryParams({ parachuteDiameter: parseFloat(e.target.value) / 100 || 0.3 })
              }
              min={10}
              max={200}
              step={5}
              className="w-24 px-2 py-1 text-right"
            />
            <span className="w-12 text-sm text-slate-500">cm</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex-1 text-sm text-slate-400">抗力係数 Cd</label>
            <input
              type="number"
              value={recoveryParams.parachuteCd ?? 1.75}
              onChange={(e) =>
                setRecoveryParams({ parachuteCd: parseFloat(e.target.value) || 1.75 })
              }
              min={1}
              max={2.5}
              step={0.05}
              className="w-24 px-2 py-1 text-right"
            />
            <span className="w-12 text-sm text-slate-500"></span>
          </div>
        </div>
      )}

      {/* ストリーマー設定 */}
      {recoveryParams.method === 'streamer' && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <label className="flex-1 text-sm text-slate-400">ストリーマー面積</label>
            <input
              type="number"
              value={(recoveryParams.streamerArea ?? 0.01) * 10000}
              onChange={(e) =>
                setRecoveryParams({ streamerArea: parseFloat(e.target.value) / 10000 || 0.01 })
              }
              min={10}
              max={1000}
              step={10}
              className="w-24 px-2 py-1 text-right"
            />
            <span className="w-12 text-sm text-slate-500">cm²</span>
          </div>
        </div>
      )}

      {/* 自由落下の説明 */}
      {recoveryParams.method === 'freefall' && (
        <div className="text-sm text-slate-400 pt-2">
          機体の空力特性のみで降下します。高速で落下するため、風の影響は小さくなります。
        </div>
      )}
    </div>
  );
}
