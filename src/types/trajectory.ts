import type { Coordinates } from './mission';

/**
 * 軌道上の1点
 */
export interface TrajectoryPoint {
  time: number;                 // 時刻 [s]
  position: {
    x: number;                  // 東方向距離 [m]
    y: number;                  // 北方向距離 [m]
    z: number;                  // 高度 [m]
  };
  velocity: {
    x: number;                  // 東方向速度 [m/s]
    y: number;                  // 北方向速度 [m/s]
    z: number;                  // 鉛直速度 [m/s]
  };
  phase: 'thrust' | 'coast' | 'descent';
}

/**
 * 飛行フェーズ
 */
export type FlightPhase = 'thrust' | 'coast' | 'descent';

/**
 * 予測の不確実性楕円
 */
export interface UncertaintyEllipse {
  center: Coordinates;          // 中心（最確予測点）
  semiMajorAxis: number;        // 長軸半径 [m]
  semiMinorAxis: number;        // 短軸半径 [m]
  rotation: number;             // 回転角 [deg]（北=0）
  confidence: number;           // 信頼度（0-1）
}

/**
 * 飛行統計
 */
export interface FlightStats {
  maxAltitude: number;          // 最高高度 [m]
  apogeeTime: number;           // 頂点到達時間 [s]
  totalFlightTime: number;      // 総飛行時間 [s]
  maxVelocity: number;          // 最高速度 [m/s]
  landingVelocity: number;      // 着地速度 [m/s]
  horizontalDistance: number;   // 水平飛行距離 [m]
  landingBearing: number;       // 着地方位 [deg]
}

/**
 * 軌道計算結果
 */
export interface TrajectoryResult {
  trajectoryPoints: TrajectoryPoint[];
  predictedLanding: Coordinates;
  uncertaintyEllipse: UncertaintyEllipse;
  stats: FlightStats;
  launchSite: Coordinates;
}

/**
 * 軌道計算の設定
 */
export interface TrajectoryConfig {
  timeStep: number;             // 計算時間刻み [s]
  maxTime: number;              // 最大計算時間 [s]
  windUncertainty: number;      // 風速不確実性 [%]（例: 0.2 = 20%）
}

/**
 * デフォルトの計算設定
 */
export const DEFAULT_TRAJECTORY_CONFIG: TrajectoryConfig = {
  timeStep: 0.05,               // 50ms
  maxTime: 120,                 // 2分
  windUncertainty: 0.25,        // 25%
};
