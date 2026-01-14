/**
 * 発射地点マーカー
 */

import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useMissionStore } from '../../store/missionStore';

// カスタムアイコン（発射地点）
const launchIcon = L.divIcon({
  className: 'custom-launch-marker',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #dc2626;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 8px solid white;
        margin-bottom: 2px;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
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
        <Popup>
          <div className="text-sm">
            <div className="font-bold mb-1">発射地点</div>
            <div>緯度: {launchSite.latitude.toFixed(6)}°</div>
            <div>経度: {launchSite.longitude.toFixed(6)}°</div>
            <div>標高: {launchSite.elevation} m</div>
            <div className="mt-1 text-gray-500">
              発射角度: {launchSite.launchAngle}° / 方位: {launchSite.launchAzimuth}°
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
