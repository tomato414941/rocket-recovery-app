/**
 * テレメトリーシミュレーション用フック
 * MockTelemetryServiceとストアを接続
 */

import { useCallback, useEffect, useState } from 'react';
import { useMissionStore } from '../store/missionStore';
import { mockTelemetryService, type TelemetryServiceStatus } from '../services/telemetry';
import type { TelemetryMode, TelemetryData } from '../types/telemetry';

interface UseTelemetrySimulationReturn {
  /** 現在のステータス */
  status: TelemetryServiceStatus;
  /** 現在のテレメトリーデータ */
  current: TelemetryData | null;
  /** テレメトリー履歴 */
  history: TelemetryData[];
  /** 再生進捗 (0-1) */
  progress: number;
  /** 現在の再生時間 (秒) */
  currentTime: number;
  /** 総飛行時間 (秒) */
  totalTime: number;
  /** シミュレーション開始 */
  start: (mode?: TelemetryMode) => void;
  /** シミュレーション停止 */
  stop: () => void;
  /** 一時停止 */
  pause: () => void;
  /** 再開 */
  resume: () => void;
  /** 再生速度設定 */
  setSpeed: (speed: number) => void;
}

/**
 * テレメトリーシミュレーションフック
 */
export function useTelemetrySimulation(): UseTelemetrySimulationReturn {
  const {
    trajectoryResult,
    launchSite,
    telemetryStatus,
    currentTelemetry,
    telemetryHistory,
    addTelemetryToHistory,
    clearTelemetryHistory,
    setTelemetryStatus,
  } = useMissionStore();

  // 進捗状態
  const [progressState, setProgressState] = useState({
    progress: 0,
    currentTime: 0,
    totalTime: 0,
  });

  // コールバック登録（マウント時のみ）
  useEffect(() => {
    const unsubscribe = mockTelemetryService.onTelemetry((data) => {
      addTelemetryToHistory(data);
      // 進捗を更新
      setProgressState({
        progress: mockTelemetryService.getProgress(),
        currentTime: mockTelemetryService.getCurrentTime(),
        totalTime: mockTelemetryService.getTotalTime(),
      });
    });

    return () => {
      unsubscribe();
    };
  }, [addTelemetryToHistory]);

  // ステータス同期
  useEffect(() => {
    const checkStatus = () => {
      const serviceStatus = mockTelemetryService.getStatus();
      if (serviceStatus !== telemetryStatus) {
        setTelemetryStatus(serviceStatus);
      }
    };

    // 定期的にステータスをチェック
    const intervalId = setInterval(checkStatus, 100);
    return () => clearInterval(intervalId);
  }, [telemetryStatus, setTelemetryStatus]);

  // シミュレーション開始
  const start = useCallback(
    (mode: TelemetryMode = 'gps') => {
      if (!trajectoryResult || !launchSite) {
        console.warn('軌道計算結果がありません。先にシミュレーションを実行してください。');
        return;
      }

      clearTelemetryHistory();
      mockTelemetryService.start(trajectoryResult, launchSite, mode);
      setTelemetryStatus('running');
    },
    [trajectoryResult, launchSite, clearTelemetryHistory, setTelemetryStatus]
  );

  // シミュレーション停止
  const stop = useCallback(() => {
    mockTelemetryService.stop();
    setTelemetryStatus('idle');
  }, [setTelemetryStatus]);

  // 一時停止
  const pause = useCallback(() => {
    mockTelemetryService.pause();
    setTelemetryStatus('paused');
  }, [setTelemetryStatus]);

  // 再開
  const resume = useCallback(() => {
    mockTelemetryService.resume();
    setTelemetryStatus('running');
  }, [setTelemetryStatus]);

  // 再生速度設定
  const setSpeed = useCallback((speed: number) => {
    mockTelemetryService.setPlaybackSpeed(speed);
  }, []);

  return {
    status: telemetryStatus,
    current: currentTelemetry,
    history: telemetryHistory,
    progress: progressState.progress,
    currentTime: progressState.currentTime,
    totalTime: progressState.totalTime,
    start,
    stop,
    pause,
    resume,
    setSpeed,
  };
}
