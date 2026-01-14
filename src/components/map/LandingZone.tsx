/**
 * 着地予測範囲（楕円）
 */

import { CircleMarker, Polygon, Popup } from 'react-leaflet';
import { useMissionStore } from '../../store/missionStore';
import type { LatLngExpression } from 'leaflet';

/**
 * 楕円のポリゴン座標を生成
 */
function createEllipsePolygon(
  center: { latitude: number; longitude: number },
  semiMajor: number,
  semiMinor: number,
  rotation: number,
  segments: number = 36
): LatLngExpression[] {
  const points: LatLngExpression[] = [];
  const rotationRad = rotation * Math.PI / 180;

  // 緯度・経度の変換係数
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = 111320 * Math.cos(center.latitude * Math.PI / 180);

  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments;

    // 楕円上の点（ローカル座標）
    const x = semiMajor * Math.cos(angle);
    const y = semiMinor * Math.sin(angle);

    // 回転適用
    const xRot = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
    const yRot = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

    // 地理座標に変換
    const lat = center.latitude + yRot / metersPerDegreeLat;
    const lng = center.longitude + xRot / metersPerDegreeLon;

    points.push([lat, lng]);
  }

  return points;
}

export function LandingZone() {
  const { trajectoryResult } = useMissionStore();

  if (!trajectoryResult) return null;

  const { predictedLanding, uncertaintyEllipse, stats } = trajectoryResult;

  // 楕円のポリゴン座標
  const ellipsePoints = createEllipsePolygon(
    predictedLanding,
    uncertaintyEllipse.semiMajorAxis,
    uncertaintyEllipse.semiMinorAxis,
    uncertaintyEllipse.rotation
  );

  return (
    <>
      {/* 不確実性楕円 */}
      <Polygon
        positions={ellipsePoints}
        pathOptions={{
          color: '#dc2626',
          fillColor: '#fecaca',
          fillOpacity: 0.3,
          weight: 2,
          dashArray: '5, 5',
        }}
      />

      {/* 予測着地点マーカー */}
      <CircleMarker
        center={[predictedLanding.latitude, predictedLanding.longitude]}
        radius={10}
        pathOptions={{
          color: '#dc2626',
          fillColor: '#ef4444',
          fillOpacity: 1,
          weight: 3,
        }}
      >
        <Popup>
          <div className="text-sm">
            <div className="font-bold mb-1">予測落下地点</div>
            <div>緯度: {predictedLanding.latitude.toFixed(6)}°</div>
            <div>経度: {predictedLanding.longitude.toFixed(6)}°</div>
            <div className="mt-1 border-t pt-1">
              <div>距離: {stats.horizontalDistance.toFixed(0)} m</div>
              <div>方位: {stats.landingBearing.toFixed(0)}°</div>
              <div>飛行時間: {stats.totalFlightTime.toFixed(1)} s</div>
              <div>着地速度: {stats.landingVelocity.toFixed(1)} m/s</div>
            </div>
            <div className="mt-1 text-gray-500 text-xs">
              予測誤差: ±{uncertaintyEllipse.semiMajorAxis.toFixed(0)}m (95%信頼区間)
            </div>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}
