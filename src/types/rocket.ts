/**
 * ロケットパラメータの型定義
 */
export interface RocketParameters {
  // 質量関係
  dryMass: number;              // 空虚質量 [kg]
  propellantMass: number;       // 推進剤質量 [kg]

  // 形状・空力
  bodyDiameter: number;         // 機体直径 [m]
  bodyLength: number;           // 機体全長 [m]
  dragCoefficient: number;      // 抗力係数 Cd（通常0.4-0.6）

  // モーター
  motorTotalImpulse: number;    // 総力積 [Ns]
  motorBurnTime: number;        // 燃焼時間 [s]
  motorDelayTime: number;       // 遅延時間 [s]（パラシュート展開まで）
}

/**
 * デフォルトのロケットパラメータ（一般的なモデルロケット）
 */
export const DEFAULT_ROCKET_PARAMS: RocketParameters = {
  dryMass: 0.05,               // 50g
  propellantMass: 0.0062,      // 6.2g (A8モーター相当)
  bodyDiameter: 0.025,         // 25mm
  bodyLength: 0.30,            // 30cm
  dragCoefficient: 0.5,
  motorTotalImpulse: 2.5,      // 2.5 Ns (Aクラス)
  motorBurnTime: 0.5,          // 0.5秒
  motorDelayTime: 4,           // 4秒
};

/**
 * 計算用の基準面積を取得
 */
export function getReferenceArea(diameter: number): number {
  return Math.PI * Math.pow(diameter / 2, 2);
}

/**
 * 平均推力を計算
 */
export function getAverageThrust(totalImpulse: number, burnTime: number): number {
  return totalImpulse / burnTime;
}
