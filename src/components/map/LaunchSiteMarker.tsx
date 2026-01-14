/**
 * 発射地点マーカー
 */

import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useMissionStore } from '../../store/missionStore';

// カスタムアイコン（発射地点）- ダークテーマ用に調整
const launchIcon = L.divIcon({
  className: 'custom-launch-marker',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border: 3px solid #1e293b;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.6), 0 2px 4px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 10px solid white;
        margin-bottom: 2px;
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
      "></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/**
 * 地図クリックで発射地点を設定するハンドラ
 */
function MapClickHandler() {
  const { setLaunchSite, viewMode } = useMissionStore();

  useMapEvents({
    click(e) {
      // 設定モードでのみクリックで位置変更
      if (viewMode === 'setup') {
        setLaunchSite({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      }
    },
  });

  return null;
}

export function LaunchSiteMarker() {
  const { launchSite, setLaunchSite, viewMode } = useMissionStore();

  return (
    <>
      <MapClickHandler />
      <Marker
        position={[launchSite.latitude, launchSite.longitude]}
        icon={launchIcon}
        draggable={viewMode === 'setup'}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            setLaunchSite({
              latitude: position.lat,
              longitude: position.lng,
            });
          },
        }}
      >
        <Popup className="dark-popup">
          <div style={{ background: '#1e293b', color: '#f8fafc', padding: '8px', borderRadius: '8px', fontSize: '13px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#3b82f6' }}>発射地点</div>
            <div style={{ color: '#94a3b8' }}>緯度: <span style={{ color: '#f8fafc' }}>{launchSite.latitude.toFixed(6)}°</span></div>
            <div style={{ color: '#94a3b8' }}>経度: <span style={{ color: '#f8fafc' }}>{launchSite.longitude.toFixed(6)}°</span></div>
            <div style={{ color: '#94a3b8' }}>標高: <span style={{ color: '#f8fafc' }}>{launchSite.elevation} m</span></div>
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #334155', color: '#64748b', fontSize: '11px' }}>
              発射角度: {launchSite.launchAngle}° / 方位: {launchSite.launchAzimuth}°
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
