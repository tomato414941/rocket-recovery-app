/**
 * ミッション状態管理 (Zustand)
 */

import { create } from 'zustand';
import type { RocketParameters } from '../types/rocket';
import type { RecoveryParameters } from '../types/recovery';
import type { WeatherData } from '../types/weather';
import type { LaunchSite, Coordinates } from '../types/mission';
import type { TrajectoryResult } from '../types/trajectory';
import type { TelemetryData, TelemetryMode } from '../types/telemetry';
import type { TelemetryServiceStatus } from '../services/telemetry';
import { calculateTrajectory } from '../services/trajectory/TrajectoryService';

// デフォルト値をインポート
import { DEFAULT_ROCKET_PARAMS as defaultRocket } from '../types/rocket';
import { DEFAULT_RECOVERY_PARAMS as defaultRecovery } from '../types/recovery';
import { DEFAULT_WEATHER_DATA as defaultWeather } from '../types/weather';
import { DEFAULT_LAUNCH_SITE as defaultLaunchSite } from '../types/mission';

/**
 * アプリのビューモード
 */
export type ViewMode = 'setup' | 'simulation' | 'recovery';

/**
 * スクロール位置の型
 */
type ScrollPositions = Record<ViewMode, number>;

/**
 * ミッションストアの状態
 */
interface MissionState {
  // ビューモード
  viewMode: ViewMode;

  // ミッション設定
  launchSite: LaunchSite;
  rocketParams: RocketParameters;
  recoveryParams: RecoveryParameters;

  // 気象データ
  weatherData: WeatherData;

  // テレメトリ
  telemetryMode: TelemetryMode;
  currentTelemetry: TelemetryData | null;
  telemetryHistory: TelemetryData[];
  telemetryStatus: TelemetryServiceStatus;

  // 計算結果
  trajectoryResult: TrajectoryResult | null;
  isCalculating: boolean;
  calculationError: string | null;

  // ユーザー位置（回収モード用）
  userLocation: Coordinates | null;

  // スクロール位置（ビューごとに保持）
  scrollPositions: ScrollPositions;

  // アクション
  setViewMode: (mode: ViewMode) => void;
  setLaunchSite: (site: Partial<LaunchSite>) => void;
  setRocketParams: (params: Partial<RocketParameters>) => void;
  setRecoveryParams: (params: Partial<RecoveryParameters>) => void;
  setWeatherData: (data: Partial<WeatherData>) => void;
  setTelemetryMode: (mode: TelemetryMode) => void;
  updateTelemetry: (data: TelemetryData) => void;
  addTelemetryToHistory: (data: TelemetryData) => void;
  clearTelemetryHistory: () => void;
  setTelemetryStatus: (status: TelemetryServiceStatus) => void;
  setUserLocation: (coords: Coordinates | null) => void;
  setScrollPosition: (mode: ViewMode, position: number) => void;
  runSimulation: () => void;
  resetToDefaults: () => void;
}

/**
 * ミッションストア
 */
export const useMissionStore = create<MissionState>((set, get) => ({
  // 初期状態
  viewMode: 'setup',
  launchSite: defaultLaunchSite,
  rocketParams: defaultRocket,
  recoveryParams: defaultRecovery,
  weatherData: defaultWeather,
  telemetryMode: 'none',
  currentTelemetry: null,
  telemetryHistory: [],
  telemetryStatus: 'idle',
  trajectoryResult: null,
  isCalculating: false,
  calculationError: null,
  userLocation: null,
  scrollPositions: { setup: 0, simulation: 0, recovery: 0 },

  // アクション
  setViewMode: (mode) => set({ viewMode: mode }),

  setLaunchSite: (site) =>
    set((state) => ({
      launchSite: { ...state.launchSite, ...site },
      trajectoryResult: null, // パラメータ変更時は結果をクリア
    })),

  setRocketParams: (params) =>
    set((state) => ({
      rocketParams: { ...state.rocketParams, ...params },
      trajectoryResult: null,
    })),

  setRecoveryParams: (params) =>
    set((state) => ({
      recoveryParams: { ...state.recoveryParams, ...params },
      trajectoryResult: null,
    })),

  setWeatherData: (data) =>
    set((state) => ({
      weatherData: { ...state.weatherData, ...data },
      trajectoryResult: null,
    })),

  setTelemetryMode: (mode) => set({ telemetryMode: mode }),

  updateTelemetry: (data) => set({ currentTelemetry: data }),

  addTelemetryToHistory: (data) =>
    set((state) => ({
      telemetryHistory: [...state.telemetryHistory, data],
      currentTelemetry: data,
    })),

  clearTelemetryHistory: () =>
    set({
      telemetryHistory: [],
      currentTelemetry: null,
      telemetryStatus: 'idle',
    }),

  setTelemetryStatus: (status) => set({ telemetryStatus: status }),

  setUserLocation: (coords) => set({ userLocation: coords }),

  setScrollPosition: (mode, position) =>
    set((state) => ({
      scrollPositions: { ...state.scrollPositions, [mode]: position },
    })),

  runSimulation: () => {
    const state = get();
    set({ isCalculating: true, calculationError: null });

    try {
      const result = calculateTrajectory({
        rocket: state.rocketParams,
        recovery: state.recoveryParams,
        launchSite: state.launchSite,
        weather: state.weatherData,
      });

      set({
        trajectoryResult: result,
        isCalculating: false,
        viewMode: 'simulation',
      });
    } catch (error) {
      set({
        isCalculating: false,
        calculationError: error instanceof Error ? error.message : '計算エラー',
      });
    }
  },

  resetToDefaults: () =>
    set({
      launchSite: defaultLaunchSite,
      rocketParams: defaultRocket,
      recoveryParams: defaultRecovery,
      weatherData: defaultWeather,
      trajectoryResult: null,
      calculationError: null,
    }),
}));
