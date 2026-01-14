/**
 * Open-Meteo API連携
 *
 * 無料の天気APIから現在の気象データを取得
 * https://open-meteo.com/
 */

import type { WeatherData, WindLayer } from '../../types/weather';

/**
 * Open-Meteo APIのレスポンス型
 */
interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly?: {
    time: string[];
    wind_speed_80m?: number[];
    wind_speed_120m?: number[];
    wind_direction_80m?: number[];
    wind_direction_120m?: number[];
  };
}

/**
 * Open-Meteo APIから気象データを取得
 *
 * @param latitude - 緯度
 * @param longitude - 経度
 * @returns WeatherData
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m',
    hourly: 'wind_speed_80m,wind_speed_120m,wind_direction_80m,wind_direction_120m',
    timezone: 'auto',
    forecast_days: '1',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`天気データの取得に失敗しました: ${response.status}`);
  }

  const data: OpenMeteoResponse = await response.json();

  // 高度別風データを構築（現在時刻のデータを使用）
  const windLayers: WindLayer[] = [];

  if (data.hourly) {
    // 現在時刻に最も近いインデックスを取得
    const now = new Date();
    const currentHour = now.getHours();
    const hourIndex = Math.min(currentHour, (data.hourly.time?.length ?? 1) - 1);

    // 80mの風データ
    if (data.hourly.wind_speed_80m && data.hourly.wind_direction_80m) {
      windLayers.push({
        altitude: 80,
        windSpeed: data.hourly.wind_speed_80m[hourIndex] ?? 0,
        windDirection: data.hourly.wind_direction_80m[hourIndex] ?? 0,
      });
    }

    // 120mの風データ
    if (data.hourly.wind_speed_120m && data.hourly.wind_direction_120m) {
      windLayers.push({
        altitude: 120,
        windSpeed: data.hourly.wind_speed_120m[hourIndex] ?? 0,
        windDirection: data.hourly.wind_direction_120m[hourIndex] ?? 0,
      });
    }
  }

  return {
    surfaceWindSpeed: data.current.wind_speed_10m,
    surfaceWindDirection: data.current.wind_direction_10m,
    surfaceTemperature: data.current.temperature_2m,
    surfacePressure: data.current.surface_pressure,
    windLayers: windLayers.length > 0 ? windLayers : undefined,
    source: 'api',
    timestamp: new Date(),
  };
}
