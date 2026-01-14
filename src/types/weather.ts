/**
 * 高度別風データ
 */
export interface WindLayer {
  altitude: number;             // 高度 [m]
  windSpeed: number;            // 風速 [m/s]
  windDirection: number;        // 風向 [deg]（北=0, 時計回り）
}

/**
 * 気象データ
 */
export interface WeatherData {
  // 地上データ
  surfaceWindSpeed: number;     // 地上風速 [m/s]
  surfaceWindDirection: number; // 風向 [deg]
  surfaceTemperature: number;   // 気温 [°C]
  surfacePressure: number;      // 気圧 [hPa]

  // 高度別データ（オプション）
  windLayers?: WindLayer[];

  // メタデータ
  source: 'manual' | 'api';
  timestamp?: Date;
}

/**
 * デフォルトの気象データ（無風、標準大気）
 */
export const DEFAULT_WEATHER_DATA: WeatherData = {
  surfaceWindSpeed: 0,
  surfaceWindDirection: 0,
  surfaceTemperature: 15,       // 15°C（ISA海面高度）
  surfacePressure: 1013.25,     // 標準気圧
  source: 'manual',
};

/**
 * 風向を方位文字列に変換
 */
export function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * 風向を日本語に変換
 */
export function getWindDirectionLabelJa(degrees: number): string {
  const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東',
                      '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
