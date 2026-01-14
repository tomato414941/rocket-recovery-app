/**
 * 気象データ設定
 */

import { useState } from 'react';
import { useMissionStore } from '../../store/missionStore';
import { getWindDirectionLabelJa } from '../../types/weather';
import { fetchWeatherData } from '../../services/weather/WeatherAPI';
import { Wind, Thermometer, Gauge, Cloud, Loader2 } from 'lucide-react';

export function WeatherSettings() {
  const { weatherData, setWeatherData, launchSite } = useMissionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchWeather = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWeatherData(launchSite.latitude, launchSite.longitude);
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '天気データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 bg-slate-700/50 p-3 rounded-lg">
      {/* API取得ボタン */}
      <div className="space-y-2">
        <button
          onClick={handleFetchWeather}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              取得中...
            </>
          ) : (
            <>
              <Cloud size={16} />
              発射地点の天気を取得
            </>
          )}
        </button>
        {error && (
          <div className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded">
            {error}
          </div>
        )}
        {weatherData.source === 'api' && weatherData.timestamp && (
          <div className="text-xs text-green-400">
            ✓ API取得済み ({weatherData.timestamp.toLocaleTimeString()})
          </div>
        )}
      </div>

      {/* 風速・風向 */}
      <div className="space-y-2 pt-2 border-t border-slate-600">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Wind size={16} className="text-blue-400" />
          <span className="font-medium">風</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="w-16 text-sm text-slate-400">風速</label>
          <input
            type="number"
            value={weatherData.surfaceWindSpeed}
            onChange={(e) => setWeatherData({ surfaceWindSpeed: parseFloat(e.target.value) || 0 })}
            min={0}
            max={20}
            step={0.1}
            className="flex-1 px-2 py-1"
          />
          <span className="text-sm text-slate-500">m/s</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="w-16 text-sm text-slate-400">風向</label>
          <input
            type="range"
            value={weatherData.surfaceWindDirection}
            onChange={(e) => setWeatherData({ surfaceWindDirection: parseInt(e.target.value) })}
            min={0}
            max={359}
            className="flex-1"
          />
          <span className="w-16 text-sm text-slate-300 text-right">
            {weatherData.surfaceWindDirection}°
          </span>
        </div>
        <div className="text-xs text-slate-500">
          {getWindDirectionLabelJa(weatherData.surfaceWindDirection)}からの風
          {weatherData.surfaceWindSpeed > 0 && (
            <span className="ml-2 text-slate-400">
              (時速 {(weatherData.surfaceWindSpeed * 3.6).toFixed(1)} km/h)
            </span>
          )}
        </div>
      </div>

      {/* 高度別風データ（APIから取得時のみ表示） */}
      {weatherData.windLayers && weatherData.windLayers.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-slate-600">
          <div className="text-xs text-slate-400">高度別風データ:</div>
          {weatherData.windLayers.map((layer) => (
            <div key={layer.altitude} className="text-xs text-slate-500 flex justify-between">
              <span>{layer.altitude}m</span>
              <span>
                {layer.windSpeed.toFixed(1)} m/s / {layer.windDirection}°
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 気温・気圧 */}
      <div className="space-y-2 pt-2 border-t border-slate-600">
        <div className="flex items-center gap-2">
          <Thermometer size={14} className="text-orange-400" />
          <label className="flex-1 text-sm text-slate-400">気温</label>
          <input
            type="number"
            value={weatherData.surfaceTemperature}
            onChange={(e) => setWeatherData({ surfaceTemperature: parseFloat(e.target.value) || 15 })}
            min={-30}
            max={50}
            step={1}
            className="w-20 px-2 py-1 text-right"
          />
          <span className="text-sm text-slate-500">°C</span>
        </div>
        <div className="flex items-center gap-2">
          <Gauge size={14} className="text-green-400" />
          <label className="flex-1 text-sm text-slate-400">気圧</label>
          <input
            type="number"
            value={weatherData.surfacePressure}
            onChange={(e) => setWeatherData({ surfacePressure: parseFloat(e.target.value) || 1013 })}
            min={900}
            max={1100}
            step={1}
            className="w-20 px-2 py-1 text-right"
          />
          <span className="text-sm text-slate-500">hPa</span>
        </div>
      </div>

      {/* 風速の目安 */}
      <div className="pt-2 border-t border-slate-600">
        <div className="text-xs text-slate-500 space-y-1">
          <div className="font-medium text-slate-400">風速の目安:</div>
          <div className="grid grid-cols-2 gap-x-4">
            <span>0-2 m/s: 静穏</span>
            <span>2-4 m/s: 軽風</span>
            <span>4-6 m/s: 軟風</span>
            <span>6-8 m/s: 和風</span>
          </div>
        </div>
      </div>
    </div>
  );
}
