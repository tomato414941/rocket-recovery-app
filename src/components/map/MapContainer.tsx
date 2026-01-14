/**
 * 地図コンテナ（Leaflet）
 */

import { useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet';
import { useMissionStore } from '../../store/missionStore';
import { LaunchSiteMarker } from './LaunchSiteMarker';
import { TrajectoryPath } from './TrajectoryPath';
import { LandingZone } from './LandingZone';
import 'leaflet/dist/leaflet.css';

/**
 * 地図の中心を更新するコンポーネント
 */
function MapUpdater() {
  const map = useMap();
  const { launchSite, trajectoryResult } = useMissionStore();

  useEffect(() => {
    if (trajectoryResult) {
      // 結果がある場合は発射地点と着地点を含む範囲にフィット
      const bounds = [
        [launchSite.latitude, launchSite.longitude],
        [trajectoryResult.predictedLanding.latitude, trajectoryResult.predictedLanding.longitude],
      ] as [[number, number], [number, number]];

      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // 結果がない場合は発射地点にセンタリング
      map.setView([launchSite.latitude, launchSite.longitude], 15);
    }
  }, [map, launchSite, trajectoryResult]);

  return null;
}

/**
 * メインの地図コンポーネント
 */
export function MapView() {
  const { launchSite, trajectoryResult } = useMissionStore();

  return (
    <LeafletMapContainer
      center={[launchSite.latitude, launchSite.longitude]}
      zoom={15}
      className="w-full h-full"
      style={{ background: '#1e293b' }}
    >
      {/* ダーク地図タイル（CartoDB Dark Matter） */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* 地図更新ハンドラ */}
      <MapUpdater />

      {/* 発射地点マーカー */}
      <LaunchSiteMarker />

      {/* 軌道表示 */}
      {trajectoryResult && <TrajectoryPath />}

      {/* 着地予測範囲 */}
      {trajectoryResult && <LandingZone />}
    </LeafletMapContainer>
  );
}
