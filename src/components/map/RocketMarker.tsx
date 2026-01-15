/**
 * ロケット位置マーカー（ライブテレメトリー用）
 */

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMissionStore } from '../../store/missionStore';

/**
 * 飛行フェーズから色を取得
 */
function getPhaseColor(altitude: number, velocity: number): { main: string; glow: string } {
  // 上昇中（速度が正の垂直成分を持つ場合）
  if (velocity > 5) {
    return { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' }; // 青
  }
  // 着地（高度が低い）
  if (altitude < 10) {
    return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' }; // 赤
  }
  // 降下中
  return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)' }; // 緑
}

/**
 * ロケットアイコンを生成
 */
function createRocketIcon(isLive: boolean, altitude: number, velocity: number): L.DivIcon {
  const colors = getPhaseColor(altitude, velocity);
  const pulseAnimation = isLive
    ? `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
      }
      animation: pulse 1.5s ease-in-out infinite;
    `
    : '';

  return L.divIcon({
    className: 'custom-rocket-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        position: relative;
        ${pulseAnimation}
      ">
        <!-- 外側のグロー -->
        <div style="
          position: absolute;
          inset: -4px;
          background: ${colors.glow};
          border-radius: 50%;
          filter: blur(6px);
        "></div>
        <!-- メインの円 -->
        <div style="
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, ${colors.main}, ${colors.main}dd);
          border: 3px solid #1e293b;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <!-- ロケットアイコン -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L8 8v6l-4 4v2h4v-2l4-4 4 4v2h4v-2l-4-4V8l-4-6z"/>
          </svg>
        </div>
        ${isLive ? `
          <!-- ライブインジケーター -->
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            width: 10px;
            height: 10px;
            background: #22c55e;
            border: 2px solid #1e293b;
            border-radius: 50%;
            box-shadow: 0 0 6px #22c55e;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

/**
 * ロケット位置マーカーコンポーネント
 */
export function RocketMarker() {
  const { currentTelemetry, telemetryStatus } = useMissionStore();

  // テレメトリーデータがない、または座標がない場合は表示しない
  if (!currentTelemetry || !currentTelemetry.coordinates) {
    return null;
  }

  const { coordinates } = currentTelemetry;
  const altitude = currentTelemetry.altitude ?? 0;
  const velocity = currentTelemetry.velocity ?? 0;
  const isLive = telemetryStatus === 'running';
  const icon = createRocketIcon(isLive, altitude, velocity);

  return (
    <Marker
      position={[coordinates.latitude, coordinates.longitude]}
      icon={icon}
      zIndexOffset={1000}
    >
      <Popup className="dark-popup">
        <div style={{ background: '#1e293b', color: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '13px', minWidth: '140px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isLive && (
              <span style={{
                width: '8px',
                height: '8px',
                background: '#22c55e',
                borderRadius: '50%',
                boxShadow: '0 0 6px #22c55e',
              }}></span>
            )}
            ロケット位置
          </div>
          <div style={{ color: '#94a3b8' }}>
            高度: <span style={{ color: '#f8fafc', fontWeight: 500 }}>{altitude.toFixed(1)} m</span>
          </div>
          <div style={{ color: '#94a3b8' }}>
            速度: <span style={{ color: '#f8fafc', fontWeight: 500 }}>{velocity.toFixed(1)} m/s</span>
          </div>
          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #334155', color: '#64748b', fontSize: '11px' }}>
            {coordinates.latitude.toFixed(6)}°, {coordinates.longitude.toFixed(6)}°
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
