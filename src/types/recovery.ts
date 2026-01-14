/**
 * 回収方式
 */
export type RecoveryMethod = 'parachute' | 'streamer' | 'freefall';

/**
 * 回収パラメータ
 */
export interface RecoveryParameters {
  method: RecoveryMethod;

  // パラシュート用
  parachuteDiameter?: number;   // パラシュート直径 [m]
  parachuteCd?: number;         // パラシュートCd（通常1.5-2.0）

  // ストリーマー用
  streamerArea?: number;        // ストリーマー面積 [m²]
  streamerCd?: number;          // ストリーマーCd
}

/**
 * デフォルトの回収パラメータ（パラシュート）
 */
export const DEFAULT_RECOVERY_PARAMS: RecoveryParameters = {
  method: 'parachute',
  parachuteDiameter: 0.30,     // 30cm
  parachuteCd: 1.75,
};

/**
 * パラシュートの投影面積を計算
 */
export function getParachuteArea(diameter: number): number {
  return Math.PI * Math.pow(diameter / 2, 2);
}

/**
 * 回収方式の表示名
 */
export const RECOVERY_METHOD_LABELS: Record<RecoveryMethod, string> = {
  parachute: 'パラシュート',
  streamer: 'ストリーマー',
  freefall: '自由落下',
};
