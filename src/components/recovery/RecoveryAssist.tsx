/**
 * 回収支援パネル
 */

import { useEffect, useState } from 'react';
import { useMissionStore } from '../../store/missionStore';
import { calculateDistance, calculateBearing } from '../../types/mission';
import { Navigation, MapPin, RefreshCw } from 'lucide-react';

// iOSのDeviceOrientationEvent拡張
interface DeviceOrientationEventWithWebkit extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

export function RecoveryAssist() {
  const {
    trajectoryResult,
    userLocation,
    setUserLocation,
  } = useMissionStore();

  const [watchId, setWatchId] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);

  // 現在地の追跡を開始/停止
  const toggleTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      return;
    }

    if (!navigator.geolocation) {
      alert('このブラウザでは位置情報を取得できません');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('位置情報エラー:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    setWatchId(id);
  };

  // デバイスの方位を取得
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // iOSとAndroidで方位の扱いが異なる
        const eventWithWebkit = event as DeviceOrientationEventWithWebkit;
        const compassHeading = eventWithWebkit.webkitCompassHeading ?? (360 - event.alpha);
        setHeading(compassHeading);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  if (!trajectoryResult) {
    return (
      <div className="p-4 text-center text-slate-500">
        シミュレーションを実行してから回収支援を使用してください
      </div>
    );
  }

  const { predictedLanding } = trajectoryResult;

  // 距離と方位を計算
  const distance = userLocation
    ? calculateDistance(userLocation, predictedLanding)
    : null;

  const bearing = userLocation
    ? calculateBearing(userLocation, predictedLanding)
    : null;

  // コンパス相対方位（デバイスの向きを考慮）
  const relativeBearing =
    bearing !== null && heading !== null
      ? (bearing - heading + 360) % 360
      : null;

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-slate-50 flex items-center gap-2">
        <Navigation size={18} className="text-blue-400" />
        回収支援
      </h3>

      {/* 位置追跡ボタン */}
      <button
        onClick={toggleTracking}
        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
          watchId !== null
            ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
            : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500'
        }`}
      >
        {watchId !== null ? (
          <>
            <RefreshCw size={18} className="animate-spin" />
            追跡中...（タップで停止）
          </>
        ) : (
          <>
            <MapPin size={18} />
            現在地追跡を開始
          </>
        )}
      </button>

      {/* ナビゲーション情報 */}
      {userLocation && distance !== null && bearing !== null && (
        <div className="bg-slate-700/50 rounded-lg p-4 space-y-4 border border-slate-600">
          {/* 距離 */}
          <div className="text-center">
            <div className="text-sm text-slate-400">目標までの距離</div>
            <div className="text-4xl font-bold text-slate-50">
              {distance < 1000
                ? `${distance.toFixed(0)} m`
                : `${(distance / 1000).toFixed(2)} km`}
            </div>
          </div>

          {/* コンパス */}
          <div className="flex justify-center">
            <div
              className="w-32 h-32 rounded-full border-4 border-slate-600 relative flex items-center justify-center bg-slate-800"
              style={{
                transform: heading !== null ? `rotate(${-heading}deg)` : 'none',
              }}
            >
              {/* 北マーカー */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400">
                N
              </div>
              {/* 方位矢印 */}
              <div
                className="absolute w-2 h-16 bg-gradient-to-t from-red-600 to-red-400 rounded-full origin-bottom shadow-lg shadow-red-500/50"
                style={{
                  transform: `rotate(${bearing}deg) translateY(-50%)`,
                }}
              />
              {/* 中心点 */}
              <div className="w-4 h-4 bg-blue-500 rounded-full z-10 shadow-lg shadow-blue-500/50" />
            </div>
          </div>

          {/* 方位情報 */}
          <div className="text-center">
            <div className="text-sm text-slate-400">方位</div>
            <div className="text-2xl font-semibold text-slate-50">
              {bearing.toFixed(0)}°
              <span className="text-lg ml-2 text-slate-400">
                ({getCompassDirection(bearing)})
              </span>
            </div>
            {relativeBearing !== null && (
              <div className="text-sm text-slate-500 mt-1">
                {relativeBearing < 30 || relativeBearing > 330
                  ? <span className="text-green-400">正面方向</span>
                  : relativeBearing < 180
                  ? <span className="text-amber-400">右に {relativeBearing.toFixed(0)}°</span>
                  : <span className="text-amber-400">左に {(360 - relativeBearing).toFixed(0)}°</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 予測着地点情報 */}
      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
        <div className="text-sm font-medium text-slate-300 mb-2">予測落下地点</div>
        <div className="text-sm text-slate-400">
          <div>緯度: <span className="text-slate-200">{predictedLanding.latitude.toFixed(6)}°</span></div>
          <div>経度: <span className="text-slate-200">{predictedLanding.longitude.toFixed(6)}°</span></div>
        </div>
      </div>

      {/* 現在地情報 */}
      {userLocation && (
        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
          <div className="text-sm font-medium text-slate-300 mb-2">現在地</div>
          <div className="text-sm text-slate-400">
            <div>緯度: <span className="text-slate-200">{userLocation.latitude.toFixed(6)}°</span></div>
            <div>経度: <span className="text-slate-200">{userLocation.longitude.toFixed(6)}°</span></div>
          </div>
        </div>
      )}
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
