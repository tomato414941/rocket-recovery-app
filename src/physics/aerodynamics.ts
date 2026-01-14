/**
 * 空気力学計算
 *
 * 抗力、揚力、空気抵抗の計算
 */

import { getDensity } from './atmosphere';

/**
 * 抗力を計算 [N]
 *
 * D = 0.5 * ρ * v² * Cd * A
 *
 * @param velocity - 速度 [m/s]
 * @param cd - 抗力係数
 * @param referenceArea - 基準面積 [m²]
 * @param altitude - 高度 [m]
 * @param surfaceTemp - 地上気温 [°C]（オプション）
 * @param surfacePressure - 地上気圧 [hPa]（オプション）
 */
export function calculateDrag(
  velocity: number,
  cd: number,
  referenceArea: number,
  altitude: number,
  surfaceTemp?: number,
  surfacePressure?: number
): number {
  const density = getDensity(altitude, surfaceTemp, surfacePressure);
  return 0.5 * density * velocity * velocity * cd * referenceArea;
}

/**
 * 抗力係数の速度依存性を考慮した計算
 *
 * マッハ数が0.8を超えると抗力係数が増加（遷音速域）
 * モデルロケットでは通常この領域に達しないが、念のため実装
 */
export function getEffectiveCd(
  baseCd: number,
  velocity: number,
  altitude: number,
  _surfaceTemp?: number
): number {
  // 音速計算（簡易版）
  const T = 288.15 + (-0.0065 * altitude);  // 気温 [K]
  const speedOfSound = Math.sqrt(1.4 * 287 * T);
  const mach = velocity / speedOfSound;

  // マッハ0.8以下は基本Cd
  if (mach < 0.8) {
    return baseCd;
  }

  // マッハ0.8-1.2で抗力係数増加（遷音速域）
  if (mach < 1.2) {
    const factor = 1 + 0.5 * Math.pow((mach - 0.8) / 0.4, 2);
    return baseCd * factor;
  }

  // マッハ1.2以上（超音速）- モデルロケットでは通常到達しない
  return baseCd * 1.2;
}

/**
 * 終端速度を計算 [m/s]
 *
 * 抗力 = 重力 のとき
 * v_terminal = sqrt(2 * m * g / (ρ * Cd * A))
 */
export function calculateTerminalVelocity(
  mass: number,
  cd: number,
  referenceArea: number,
  altitude: number,
  surfaceTemp?: number,
  surfacePressure?: number
): number {
  const density = getDensity(altitude, surfaceTemp, surfacePressure);
  const g = 9.80665;

  return Math.sqrt((2 * mass * g) / (density * cd * referenceArea));
}

/**
 * 動圧を計算 [Pa]
 *
 * q = 0.5 * ρ * v²
 */
export function calculateDynamicPressure(
  velocity: number,
  altitude: number,
  surfaceTemp?: number,
  surfacePressure?: number
): number {
  const density = getDensity(altitude, surfaceTemp, surfacePressure);
  return 0.5 * density * velocity * velocity;
}

/**
 * レイノルズ数を計算（参考用）
 *
 * Re = ρ * v * L / μ
 */
export function calculateReynoldsNumber(
  velocity: number,
  characteristicLength: number,
  altitude: number,
  surfaceTemp?: number
): number {
  const density = getDensity(altitude, surfaceTemp);
  // 動粘性係数（簡易推定）
  const T = 288.15 + (-0.0065 * altitude);
  const mu = 1.458e-6 * Math.pow(T, 1.5) / (T + 110.4);  // Sutherland's formula

  return density * velocity * characteristicLength / mu;
}
