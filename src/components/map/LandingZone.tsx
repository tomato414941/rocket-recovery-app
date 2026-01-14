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
      {/* 不確実性楕円 - ダークテーマ用に調整 */}
      <Polygon
        positions={ellipsePoints}
        pathOptions={{
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '5, 5',
        }}
      />

      {/* 予測着地点マーカー */}
      <CircleMarker
        center={[predictedLanding.latitude, predictedLanding.longitude]}
        radius={12}
        pathOptions={{
          color: '#1e293b',
          fillColor: '#ef4444',
          fillOpacity: 1,
          weight: 3,
        }}
      >
        <Popup className="dark-popup">
          <div style={{ background: '#1e293b', color: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '13px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#ef4444' }}>予測落下地点</div>
            <div style={{ color: '#94a3b8' }}>緯度: <span style={{ color: '#f8fafc' }}>{predictedLanding.latitude.toFixed(6)}°</span></div>
            <div style={{ color: '#94a3b8' }}>経度: <span style={{ color: '#f8fafc' }}>{predictedLanding.longitude.toFixed(6)}°</span></div>
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #334155' }}>
              <div style={{ color: '#94a3b8' }}>距離: <span style={{ color: '#f8fafc' }}>{stats.horizontalDistance.toFixed(0)} m</span></div>
              <div style={{ color: '#94a3b8' }}>方位: <span style={{ color: '#f8fafc' }}>{stats.landingBearing.toFixed(0)}°</span></div>
              <div style={{ color: '#94a3b8' }}>飛行時間: <span style={{ color: '#f8fafc' }}>{stats.totalFlightTime.toFixed(1)} s</span></div>
              <div style={{ color: '#94a3b8' }}>着地速度: <span style={{ color: '#f8fafc' }}>{stats.landingVelocity.toFixed(1)} m/s</span></div>
            </div>
            <div style={{ marginTop: '6px', color: '#64748b', fontSize: '11px' }}>
              予測誤差: ±{uncertaintyEllipse.semiMajorAxis.toFixed(0)}m (95%信頼区間)
            </div>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}
