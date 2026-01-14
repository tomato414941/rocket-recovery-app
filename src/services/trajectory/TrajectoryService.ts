/**
 * 軌道計算サービス
 *
 * 上昇・降下計算を統合し、完全な飛行軌道を計算
 */

import { calculateAscent, type AscentInput } from '../../physics/ballistics';
import { calculateDescent, type DescentInput } from '../../physics/parachute';
import {
  createWindProfileFromWeather,
  calculateUncertaintyEllipse,
  type WindUncertainty,
  DEFAULT_WIND_UNCERTAINTY,
} from '../../physics/windEffect';
import type { RocketParameters } from '../../types/rocket';
import type { RecoveryParameters } from '../../types/recovery';
import type { WeatherData } from '../../types/weather';
import type { LaunchSite, Coordinates } from '../../types/mission';
import type {
  TrajectoryResult,
  TrajectoryPoint,
  FlightStats,
  UncertaintyEllipse,
} from '../../types/trajectory';

/**
 * 軌道計算の入力
 */
export interface TrajectoryInput {
  rocket: RocketParameters;
  recovery: RecoveryParameters;
  launchSite: LaunchSite;
  weather: WeatherData;
  windUncertainty?: WindUncertainty;
}

/**
 * 完全な飛行軌道を計算
 */
export function calculateTrajectory(input: TrajectoryInput): TrajectoryResult {
  const {
    rocket,
    recovery,
    launchSite,
    weather,
    windUncertainty = DEFAULT_WIND_UNCERTAINTY,
  } = input;

  // 風プロファイルを作成
  const windProfile = createWindProfileFromWeather(weather);

  // 上昇フェーズ計算
  const ascentInput: AscentInput = {
    rocket,
    launchAngle: launchSite.launchAngle,
    launchAzimuth: launchSite.launchAzimuth,
    launchElevation: launchSite.elevation,
    windSpeed: weather.surfaceWindSpeed,
    windDirection: weather.surfaceWindDirection,
    surfaceTemp: weather.surfaceTemperature,
    surfacePressure: weather.surfacePressure,
  };

  const ascentResult = calculateAscent(ascentInput);

  // 降下フェーズ計算
  const descentInput: DescentInput = {
    recovery,
    rocketMass: rocket.dryMass,
    rocketDiameter: rocket.bodyDiameter,
    rocketCd: rocket.dragCoefficient,
    startPosition: ascentResult.apogee.position,
    startVelocity: { x: 0, y: 0, z: -0.1 }, // 頂点では鉛直速度ほぼ0
    startTime: ascentResult.apogee.time,
    groundLevel: launchSite.elevation,
    getWindAtAltitude: (altitude) => windProfile.getWindAtAltitude(altitude),
    surfaceTemp: weather.surfaceTemperature,
    surfacePressure: weather.surfacePressure,
  };

  const descentResult = calculateDescent(descentInput);

  // 軌道点を結合
  const trajectoryPoints: TrajectoryPoint[] = [
    ...ascentResult.trajectoryPoints,
    ...descentResult.trajectoryPoints,
  ];

  // 着地点の座標を計算
  const landingPosition = descentResult.landing.position;
  const predictedLanding = positionToCoordinates(
    launchSite,
    landingPosition.x,
    landingPosition.y
  );

  // 水平移動距離を計算
  const horizontalDistance = Math.sqrt(
    landingPosition.x * landingPosition.x +
    landingPosition.y * landingPosition.y
  );

  // 着地方位を計算
  const landingBearing = Math.atan2(landingPosition.x, landingPosition.y) * 180 / Math.PI;
  const normalizedBearing = (landingBearing + 360) % 360;

  // 不確実性楕円を計算
  const ellipseParams = calculateUncertaintyEllipse(
    horizontalDistance,
    weather.surfaceWindDirection,
    windUncertainty
  );

  const uncertaintyEllipse: UncertaintyEllipse = {
    center: predictedLanding,
    semiMajorAxis: ellipseParams.semiMajor,
    semiMinorAxis: ellipseParams.semiMinor,
    rotation: ellipseParams.rotation,
    confidence: 0.95,
  };

  // 飛行統計
  const stats: FlightStats = {
    maxAltitude: ascentResult.apogee.altitude,
    apogeeTime: ascentResult.apogee.time,
    totalFlightTime: descentResult.landing.time,
    maxVelocity: ascentResult.maxVelocity,
    landingVelocity: descentResult.landing.velocity,
    horizontalDistance,
    landingBearing: normalizedBearing,
  };

  return {
    trajectoryPoints,
    predictedLanding,
    uncertaintyEllipse,
    stats,
    launchSite: {
      latitude: launchSite.latitude,
      longitude: launchSite.longitude,
    },
  };
}

/**
 * ローカル座標（x: 東, y: 北）を地理座標に変換
 */
function positionToCoordinates(
  origin: LaunchSite,
  x: number,
  y: number
): Coordinates {
  // 緯度1度あたりの距離（約111km）
  const metersPerDegreeLat = 111320;
  // 経度1度あたりの距離（緯度により変化）
  const metersPerDegreeLon = 111320 * Math.cos(origin.latitude * Math.PI / 180);

  return {
    latitude: origin.latitude + y / metersPerDegreeLat,
    longitude: origin.longitude + x / metersPerDegreeLon,
  };
}

/**
 * 地理座標をローカル座標に変換
 */
export function coordinatesToPosition(
  origin: LaunchSite,
  coords: Coordinates
): { x: number; y: number } {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = 111320 * Math.cos(origin.latitude * Math.PI / 180);

  return {
    x: (coords.longitude - origin.longitude) * metersPerDegreeLon,
    y: (coords.latitude - origin.latitude) * metersPerDegreeLat,
  };
}
