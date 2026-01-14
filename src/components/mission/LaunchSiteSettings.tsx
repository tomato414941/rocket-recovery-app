/**
 * 発射地点設定
 */

import { useMissionStore } from '../../store/missionStore';
import { MapPin, Compass } from 'lucide-react';

export function LaunchSiteSettings() {
  const { launchSite, setLaunchSite } = useMissionStore();

  // 現在地を取得
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('このブラウザでは位置情報を取得できません');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLaunchSite({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          elevation: position.coords.altitude ?? launchSite.elevation,
        });
      },
      (error) => {
        alert(`位置情報の取得に失敗しました: ${error.message}`);
      }
    );
  };

  return (
    <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
      {/* 座標入力 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="w-16 text-sm text-gray-600">緯度</label>
          <input
            type="number"
            value={launchSite.latitude}
            onChange={(e) => setLaunchSite({ latitude: parseFloat(e.target.value) || 0 })}
            step={0.0001}
            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">°N</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="w-16 text-sm text-gray-600">経度</label>
          <input
            type="number"
            value={launchSite.longitude}
            onChange={(e) => setLaunchSite({ longitude: parseFloat(e.target.value) || 0 })}
            step={0.0001}
            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">°E</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="w-16 text-sm text-gray-600">標高</label>
          <input
            type="number"
            value={launchSite.elevation}
            onChange={(e) => setLaunchSite({ elevation: parseFloat(e.target.value) || 0 })}
            step={1}
            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">m</span>
        </div>
      </div>

      {/* 現在地取得ボタン */}
      <button
        onClick={getCurrentLocation}
        className="w-full py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
      >
        <MapPin size={16} />
        現在地を取得
      </button>

      {/* 発射角度・方位 */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase">発射角度</div>
        <div className="flex items-center gap-2">
          <label className="w-16 text-sm text-gray-600">仰角</label>
          <input
            type="range"
            value={launchSite.launchAngle}
            onChange={(e) => setLaunchSite({ launchAngle: parseInt(e.target.value) })}
            min={45}
            max={90}
            className="flex-1"
          />
          <span className="w-12 text-sm text-gray-700 text-right">{launchSite.launchAngle}°</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="w-16 text-sm text-gray-600">方位</label>
          <input
            type="range"
            value={launchSite.launchAzimuth}
            onChange={(e) => setLaunchSite({ launchAzimuth: parseInt(e.target.value) })}
            min={0}
            max={359}
            className="flex-1"
          />
          <span className="w-12 text-sm text-gray-700 text-right">{launchSite.launchAzimuth}°</span>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Compass size={12} />
          {getCompassDirection(launchSite.launchAzimuth)}向き発射
        </div>
      </div>
    </div>
  );
}

/**
 * 方位角を方角文字列に変換
 */
function getCompassDirection(degrees: number): string {
  const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東',
                      '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
