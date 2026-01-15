/**
 * モックテレメトリーサービス
 * 軌道計算結果を使用してリアルタイムテレメトリーをシミュレート
 */

import type { TrajectoryResult, TrajectoryPoint } from '../../types/trajectory';
import type { LaunchSite, Coordinates } from '../../types/mission';
import type { TelemetryData, TelemetryMode } from '../../types/telemetry';
import { getTemperature, getPressure } from '../../physics/atmosphere';

/**
 * テレメトリーサービスのステータス
 */
export type TelemetryServiceStatus = 'idle' | 'running' | 'paused' | 'completed';

/**
 * テレメトリーコールバック
 */
type TelemetryCallback = (data: TelemetryData) => void;

/**
 * サービス設定
 */
interface MockTelemetryConfig {
  mode: TelemetryMode;
  updateInterval: number; // ms
  playbackSpeed: number;  // 1.0 = realtime
}

const DEFAULT_CONFIG: MockTelemetryConfig = {
  mode: 'gps',
  updateInterval: 100, // 100msごとに更新
  playbackSpeed: 1.0,
};

/**
 * ローカル座標を地理座標に変換
 */
function positionToCoordinates(
  origin: LaunchSite,
  x: number,
  y: number
): Coordinates {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = 111320 * Math.cos(origin.latitude * Math.PI / 180);

  return {
    latitude: origin.latitude + y / metersPerDegreeLat,
    longitude: origin.longitude + x / metersPerDegreeLon,
  };
}

/**
 * モックテレメトリーサービスクラス
 */
export class MockTelemetryService {
  private status: TelemetryServiceStatus = 'idle';
  private config: MockTelemetryConfig = DEFAULT_CONFIG;
  private trajectoryResult: TrajectoryResult | null = null;
  private launchSite: LaunchSite | null = null;
  private currentIndex: number = 0;
  private currentTime: number = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private callbacks: TelemetryCallback[] = [];
  private startTimestamp: number = 0;
  private pausedAt: number = 0;

  /**
   * テレメトリー開始
   */
  start(
    trajectoryResult: TrajectoryResult,
    launchSite: LaunchSite,
    mode: TelemetryMode = 'gps'
  ): void {
    if (this.status === 'running') {
      return;
    }

    this.trajectoryResult = trajectoryResult;
    this.launchSite = launchSite;
    this.config.mode = mode;
    this.currentIndex = 0;
    this.currentTime = 0;
    this.startTimestamp = Date.now();
    this.status = 'running';

    this.startEmitting();
  }

  /**
   * テレメトリー停止
   */
  stop(): void {
    this.stopEmitting();
    this.status = 'idle';
    this.currentIndex = 0;
    this.currentTime = 0;
  }

  /**
   * 一時停止
   */
  pause(): void {
    if (this.status !== 'running') return;

    this.stopEmitting();
    this.pausedAt = Date.now();
    this.status = 'paused';
  }

  /**
   * 再開
   */
  resume(): void {
    if (this.status !== 'paused') return;

    // 一時停止していた時間を補正
    const pauseDuration = Date.now() - this.pausedAt;
    this.startTimestamp += pauseDuration;
    this.status = 'running';
    this.startEmitting();
  }

  /**
   * 再生速度設定
   */
  setPlaybackSpeed(speed: number): void {
    if (speed <= 0) return;

    const wasRunning = this.status === 'running';
    if (wasRunning) {
      this.stopEmitting();
    }

    this.config.playbackSpeed = speed;

    if (wasRunning) {
      this.startEmitting();
    }
  }

  /**
   * テレメトリーモード設定
   */
  setMode(mode: TelemetryMode): void {
    this.config.mode = mode;
  }

  /**
   * ステータス取得
   */
  getStatus(): TelemetryServiceStatus {
    return this.status;
  }

  /**
   * 現在の再生時間取得
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * 総飛行時間取得
   */
  getTotalTime(): number {
    return this.trajectoryResult?.stats.totalFlightTime ?? 0;
  }

  /**
   * 進捗取得 (0-1)
   */
  getProgress(): number {
    const total = this.getTotalTime();
    if (total === 0) return 0;
    return Math.min(this.currentTime / total, 1);
  }

  /**
   * テレメトリーコールバック登録
   */
  onTelemetry(callback: TelemetryCallback): () => void {
    this.callbacks.push(callback);
    // 登録解除関数を返す
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * 内部: 発信開始
   */
  private startEmitting(): void {
    if (this.intervalId) return;

    const interval = this.config.updateInterval / this.config.playbackSpeed;

    this.intervalId = setInterval(() => {
      this.emitTelemetry();
    }, interval);
  }

  /**
   * 内部: 発信停止
   */
  private stopEmitting(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 内部: テレメトリー発信
   */
  private emitTelemetry(): void {
    if (!this.trajectoryResult || !this.launchSite) return;

    const points = this.trajectoryResult.trajectoryPoints;
    const totalTime = this.trajectoryResult.stats.totalFlightTime;

    // 経過時間を計算（再生速度を考慮）
    const elapsed = (Date.now() - this.startTimestamp) * this.config.playbackSpeed / 1000;
    this.currentTime = elapsed;

    // 完了チェック
    if (elapsed >= totalTime) {
      this.currentTime = totalTime;
      this.status = 'completed';
      this.stopEmitting();

      // 最後のポイントを送信
      const lastPoint = points[points.length - 1];
      this.emitPoint(lastPoint);
      return;
    }

    // 現在時刻に対応する軌道点を補間
    const point = this.interpolatePoint(elapsed, points);
    if (point) {
      this.emitPoint(point);
    }
  }

  /**
   * 内部: 時刻から軌道点を補間
   */
  private interpolatePoint(
    time: number,
    points: TrajectoryPoint[]
  ): TrajectoryPoint | null {
    // 時刻に対応するインデックスを探す
    let i = this.currentIndex;
    while (i < points.length - 1 && points[i + 1].time <= time) {
      i++;
    }
    this.currentIndex = i;

    if (i >= points.length - 1) {
      return points[points.length - 1];
    }

    const p1 = points[i];
    const p2 = points[i + 1];
    const t = (time - p1.time) / (p2.time - p1.time);

    // 線形補間
    return {
      time,
      position: {
        x: p1.position.x + (p2.position.x - p1.position.x) * t,
        y: p1.position.y + (p2.position.y - p1.position.y) * t,
        z: p1.position.z + (p2.position.z - p1.position.z) * t,
      },
      velocity: {
        x: p1.velocity.x + (p2.velocity.x - p1.velocity.x) * t,
        y: p1.velocity.y + (p2.velocity.y - p1.velocity.y) * t,
        z: p1.velocity.z + (p2.velocity.z - p1.velocity.z) * t,
      },
      phase: p2.phase,
    };
  }

  /**
   * 内部: 軌道点からテレメトリーを生成して発信
   */
  private emitPoint(point: TrajectoryPoint): void {
    if (!this.launchSite) return;

    const mode = this.config.mode;
    if (mode === 'none') return;

    const altitude = point.position.z;
    const velocity = Math.sqrt(
      point.velocity.x ** 2 +
      point.velocity.y ** 2 +
      point.velocity.z ** 2
    );

    // 大気データを計算（ISAモデル）
    const temperature = getTemperature(altitude) - 273.15; // Kから°Cに変換
    const pressure = getPressure(altitude) / 100; // PaからhPaに変換

    // テレメトリーデータを構築
    const telemetry: TelemetryData = {
      timestamp: new Date(),
      mode,
      altitude,
      velocity,
      temperature,
      pressure,
    };

    // GPSモードの場合は座標を追加
    if (mode === 'gps') {
      telemetry.coordinates = positionToCoordinates(
        this.launchSite,
        point.position.x,
        point.position.y
      );
    }

    // コールバックを呼び出し
    this.callbacks.forEach((cb) => cb(telemetry));
  }
}

// シングルトンインスタンス
export const mockTelemetryService = new MockTelemetryService();
