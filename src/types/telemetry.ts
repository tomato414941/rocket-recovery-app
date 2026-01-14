import type { Coordinates } from './mission';

/**
 * テレメトリモード
 */
export type TelemetryMode = 'gps' | 'altitude_only' | 'none';

/**
 * テレメトリデータ
 */
export interface TelemetryData {
  timestamp: Date;
  mode: TelemetryMode;

  // GPS座標（GPSモード時）
  coordinates?: Coordinates;

  // 高度（GPS/高度モード時）
  altitude?: number;            // [m]

  // 追加データ（オプション）
  velocity?: number;            // 速度 [m/s]
  temperature?: number;         // 温度 [°C]
  pressure?: number;            // 気圧 [hPa]
}

/**
 * テレメトリ設定
 */
export interface TelemetryConfig {
  mode: TelemetryMode;
  updateInterval?: number;      // 更新間隔 [ms]
}

/**
 * デフォルトのテレメトリ設定
 */
export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  mode: 'none',
  updateInterval: 1000,
};

/**
 * テレメトリモードの表示名
 */
export const TELEMETRY_MODE_LABELS: Record<TelemetryMode, string> = {
  gps: 'GPS搭載',
  altitude_only: '高度計のみ',
  none: 'テレメトリなし',
};

/**
 * 飛行状態
 */
export type FlightStatus =
  | 'pre_launch'    // 発射前
  | 'ascending'     // 上昇中
  | 'descending'    // 降下中
  | 'landed'        // 着地
  | 'unknown';      // 不明

/**
 * 高度変化から飛行状態を推定
 */
export function estimateFlightStatus(
  currentAltitude: number,
  previousAltitude: number | null,
  groundLevel: number
): FlightStatus {
  if (previousAltitude === null) {
    return 'unknown';
  }

  const altitudeChange = currentAltitude - previousAltitude;
  const aboveGround = currentAltitude - groundLevel;

  if (aboveGround < 5) {
    return altitudeChange > 0.5 ? 'ascending' : 'landed';
  }

  if (altitudeChange > 0.5) {
    return 'ascending';
  } else if (altitudeChange < -0.5) {
    return 'descending';
  }

  return 'unknown';
}
