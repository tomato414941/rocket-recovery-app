/**
 * 軌道表示（Polyline）
 */

import { Polyline, CircleMarker, Popup } from 'react-leaflet';
import { useMissionStore } from '../../store/missionStore';
import type { LatLngExpression } from 'leaflet';

/**
 * ローカル座標を地理座標に変換
 */
function positionToLatLng(
  origin: { latitude: number; longitude: number },
  x: number,
  y: number
): [number, number] {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = 111320 * Math.cos(origin.latitude * Math.PI / 180);

  return [
    origin.latitude + y / metersPerDegreeLat,
    origin.longitude + x / metersPerDegreeLon,
  ];
}

export function TrajectoryPath() {
  const { trajectoryResult, launchSite } = useMissionStore();

  if (!trajectoryResult) return null;

  const { trajectoryPoints, stats } = trajectoryResult;

  // 上昇フェーズの座標
  const ascentPoints: LatLngExpression[] = trajectoryPoints
    .filter((p) => p.phase === 'thrust' || p.phase === 'coast')
    .map((p) => positionToLatLng(launchSite, p.position.x, p.position.y));

  // 降下フェーズの座標
  const descentPoints: LatLngExpression[] = trajectoryPoints
    .filter((p) => p.phase === 'descent')
    .map((p) => positionToLatLng(launchSite, p.position.x, p.position.y));

  // 頂点を探す
  const apogeePoint = trajectoryPoints.find(
    (p, i, arr) =>
      i > 0 &&
      i < arr.length - 1 &&
      p.position.z >= arr[i - 1].position.z &&
      p.position.z >= arr[i + 1].position.z
  );

  const apogeeLatLng = apogeePoint
    ? positionToLatLng(launchSite, apogeePoint.position.x, apogeePoint.position.y)
    : null;

  return (
    <>
      {/* 上昇軌道（青） */}
      {ascentPoints.length > 1 && (
        <Polyline
          positions={ascentPoints}
          pathOptions={{
            color: '#2563eb',
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 5',
          }}
        />
      )}

      {/* 降下軌道（緑） */}
      {descentPoints.length > 1 && (
        <Polyline
          positions={descentPoints}
          pathOptions={{
            color: '#16a34a',
            weight: 3,
            opacity: 0.8,
          }}
        />
      )}

      {/* 頂点マーカー */}
      {apogeeLatLng && (
        <CircleMarker
          center={apogeeLatLng}
          radius={8}
          pathOptions={{
            color: '#f59e0b',
            fillColor: '#fbbf24',
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-bold mb-1">頂点</div>
              <div>高度: {stats.maxAltitude.toFixed(1)} m</div>
              <div>到達時間: {stats.apogeeTime.toFixed(1)} s</div>
            </div>
          </Popup>
        </CircleMarker>
      )}
    </>
  );
}
