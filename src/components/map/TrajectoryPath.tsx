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
      {/* 上昇軌道（青・グロー効果） */}
      {ascentPoints.length > 1 && (
        <Polyline
          positions={ascentPoints}
          pathOptions={{
            color: '#3b82f6',
            weight: 4,
            opacity: 0.9,
            dashArray: '8, 8',
          }}
        />
      )}

      {/* 降下軌道（緑） */}
      {descentPoints.length > 1 && (
        <Polyline
          positions={descentPoints}
          pathOptions={{
            color: '#22c55e',
            weight: 4,
            opacity: 0.9,
          }}
        />
      )}

      {/* 頂点マーカー */}
      {apogeeLatLng && (
        <CircleMarker
          center={apogeeLatLng}
          radius={10}
          pathOptions={{
            color: '#1e293b',
            fillColor: '#f59e0b',
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Popup className="dark-popup">
            <div style={{ background: '#1e293b', color: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#f59e0b' }}>頂点 (Apogee)</div>
              <div style={{ color: '#94a3b8' }}>高度: <span style={{ color: '#f8fafc' }}>{stats.maxAltitude.toFixed(1)} m</span></div>
              <div style={{ color: '#94a3b8' }}>到達時間: <span style={{ color: '#f8fafc' }}>{stats.apogeeTime.toFixed(1)} s</span></div>
            </div>
          </Popup>
        </CircleMarker>
      )}
    </>
  );
}
