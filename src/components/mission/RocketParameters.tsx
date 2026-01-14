/**
 * ロケットパラメータ入力
 */

import { useMissionStore } from '../../store/missionStore';

/**
 * 数値入力フィールド
 */
function NumberInput({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 0.001,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex-1 text-sm text-gray-600">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span className="w-12 text-sm text-gray-500">{unit}</span>
    </div>
  );
}

export function RocketParameters() {
  const { rocketParams, setRocketParams } = useMissionStore();

  return (
    <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
      {/* 質量 */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase">質量</div>
        <NumberInput
          label="空虚質量"
          value={rocketParams.dryMass}
          onChange={(v) => setRocketParams({ dryMass: v })}
          unit="kg"
          min={0.01}
          step={0.01}
        />
        <NumberInput
          label="推進剤質量"
          value={rocketParams.propellantMass}
          onChange={(v) => setRocketParams({ propellantMass: v })}
          unit="kg"
          min={0}
          step={0.001}
        />
      </div>

      {/* 形状 */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase">形状</div>
        <NumberInput
          label="機体直径"
          value={rocketParams.bodyDiameter * 1000} // mをmmに変換して表示
          onChange={(v) => setRocketParams({ bodyDiameter: v / 1000 })}
          unit="mm"
          min={10}
          step={1}
        />
        <NumberInput
          label="機体全長"
          value={rocketParams.bodyLength * 100} // mをcmに変換して表示
          onChange={(v) => setRocketParams({ bodyLength: v / 100 })}
          unit="cm"
          min={10}
          step={1}
        />
        <NumberInput
          label="抗力係数 Cd"
          value={rocketParams.dragCoefficient}
          onChange={(v) => setRocketParams({ dragCoefficient: v })}
          unit=""
          min={0.1}
          max={2}
          step={0.05}
        />
      </div>

      {/* モーター */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase">モーター</div>
        <NumberInput
          label="総力積"
          value={rocketParams.motorTotalImpulse}
          onChange={(v) => setRocketParams({ motorTotalImpulse: v })}
          unit="Ns"
          min={0.1}
          step={0.1}
        />
        <NumberInput
          label="燃焼時間"
          value={rocketParams.motorBurnTime}
          onChange={(v) => setRocketParams({ motorBurnTime: v })}
          unit="s"
          min={0.1}
          step={0.1}
        />
        <NumberInput
          label="遅延時間"
          value={rocketParams.motorDelayTime}
          onChange={(v) => setRocketParams({ motorDelayTime: v })}
          unit="s"
          min={0}
          step={0.5}
        />
      </div>

      {/* 計算値表示 */}
      <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>総質量:</span>
          <span>{((rocketParams.dryMass + rocketParams.propellantMass) * 1000).toFixed(1)} g</span>
        </div>
        <div className="flex justify-between">
          <span>平均推力:</span>
          <span>{(rocketParams.motorTotalImpulse / rocketParams.motorBurnTime).toFixed(1)} N</span>
        </div>
      </div>
    </div>
  );
}
