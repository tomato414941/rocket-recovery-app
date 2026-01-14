/**
 * 座標
 */
export interface Coordinates {
  latitude: number;             // 緯度 [deg]
  longitude: number;            // 経度 [deg]
}

/**
 * 発射地点
 */
export interface LaunchSite {
  latitude: number;             // 緯度 [deg]
  longitude: number;            // 経度 [deg]
  elevation: number;            // 標高 [m]
  launchAngle: number;          // 発射角度 [deg]（鉛直=90）
  launchAzimuth: number;        // 発射方位 [deg]（北=0, 時計回り）
}

/**
 * デフォルトの発射地点（東京）
 */
export const DEFAULT_LAUNCH_SITE: LaunchSite = {
  latitude: 35.6762,
  longitude: 139.6503,
  elevation: 40,
  launchAngle: 85,              // 85度（少し傾いた発射）
  launchAzimuth: 0,             // 北向き
};

/**
 * 2点間の距離を計算（Haversine公式）[m]
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371000; // 地球半径 [m]
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const deltaLon = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 2点間の方位角を計算 [deg]（北=0, 時計回り）
 */
export function calculateBearing(
  from: Coordinates,
  to: Coordinates
): number {
  const lat1 = from.latitude * Math.PI / 180;
  const lat2 = to.latitude * Math.PI / 180;
  const deltaLon = (to.longitude - from.longitude) * Math.PI / 180;

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * 始点から距離と方位で終点を計算
 */
export function calculateDestination(
  start: Coordinates,
  distance: number,
  bearing: number
): Coordinates {
  const R = 6371000; // 地球半径 [m]
  const lat1 = start.latitude * Math.PI / 180;
  const lon1 = start.longitude * Math.PI / 180;
  const bearingRad = bearing * Math.PI / 180;
  const angularDistance = distance / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    latitude: lat2 * 180 / Math.PI,
    longitude: lon2 * 180 / Math.PI,
  };
}
