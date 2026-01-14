/**
 * 風影響計算
 *
 * 高度別の風速プロファイルと不確実性計算
 */

import type { WeatherData, WindLayer } from '../types/weather';

/**
 * 高度別風データのインターフェース
 */
export interface WindProfile {
  getWindAtAltitude(altitude: number): { speed: number; direction: number };
}

/**
 * 対数則による風速プロファイル
 *
 * 地表境界層（0-100m程度）での風速変化をモデル化
 * v(h) = v_ref * ln(h/z0) / ln(h_ref/z0)
 */
export function createLogLawWindProfile(
  referenceWindSpeed: number,
  referenceWindDirection: number,
  referenceHeight: number = 10,  // 気象観測標準高度
  roughnessLength: number = 0.03 // 開けた土地のz0
): WindProfile {
  return {
    getWindAtAltitude(altitude: number): { speed: number; direction: number } {
      // 最小高度（地表付近）
      const h = Math.max(altitude, 0.5);

      // 対数則で風速を計算
      const speed = referenceWindSpeed *
        Math.log(h / roughnessLength) /
        Math.log(referenceHeight / roughnessLength);

      return {
        speed: Math.max(0, speed),
        direction: referenceWindDirection,
      };
    },
  };
}

/**
 * 高度レイヤーを使用した風速プロファイル
 *
 * 複数高度の風データから線形補間
 */
export function createLayeredWindProfile(
  surfaceWindSpeed: number,
  surfaceWindDirection: number,
  windLayers?: WindLayer[]
): WindProfile {
  // レイヤーがない場合は一定風速
  if (!windLayers || windLayers.length === 0) {
    return {
      getWindAtAltitude(_altitude: number) {
        return {
          speed: surfaceWindSpeed,
          direction: surfaceWindDirection,
        };
      },
    };
  }

  // 高度でソートしたレイヤー配列を作成
  const layers: WindLayer[] = [
    { altitude: 0, windSpeed: surfaceWindSpeed, windDirection: surfaceWindDirection },
    ...windLayers,
  ].sort((a, b) => a.altitude - b.altitude);

  return {
    getWindAtAltitude(altitude: number): { speed: number; direction: number } {
      // 最下層以下
      if (altitude <= layers[0].altitude) {
        return {
          speed: layers[0].windSpeed,
          direction: layers[0].windDirection,
        };
      }

      // 最上層以上
      if (altitude >= layers[layers.length - 1].altitude) {
        const top = layers[layers.length - 1];
        return {
          speed: top.windSpeed,
          direction: top.windDirection,
        };
      }

      // 中間層は線形補間
      for (let i = 0; i < layers.length - 1; i++) {
        const lower = layers[i];
        const upper = layers[i + 1];

        if (altitude >= lower.altitude && altitude <= upper.altitude) {
          const ratio = (altitude - lower.altitude) / (upper.altitude - lower.altitude);

          // 風速の線形補間
          const speed = lower.windSpeed + ratio * (upper.windSpeed - lower.windSpeed);

          // 風向の補間（360度を跨ぐ場合を考慮）
          let dirDiff = upper.windDirection - lower.windDirection;
          if (dirDiff > 180) dirDiff -= 360;
          if (dirDiff < -180) dirDiff += 360;
          const direction = (lower.windDirection + ratio * dirDiff + 360) % 360;

          return { speed, direction };
        }
      }

      // フォールバック
      return {
        speed: surfaceWindSpeed,
        direction: surfaceWindDirection,
      };
    },
  };
}

/**
 * WeatherDataから風プロファイルを作成
 */
export function createWindProfileFromWeather(weather: WeatherData): WindProfile {
  return createLayeredWindProfile(
    weather.surfaceWindSpeed,
    weather.surfaceWindDirection,
    weather.windLayers
  );
}

/**
 * 風の不確実性を計算
 *
 * 風速の不確実性から落下点の分散を推定
 */
export interface WindUncertainty {
  speedUncertainty: number;     // 風速の相対誤差（例: 0.25 = 25%）
  directionUncertainty: number; // 風向の誤差 [deg]
}

/**
 * デフォルトの風の不確実性
 */
export const DEFAULT_WIND_UNCERTAINTY: WindUncertainty = {
  speedUncertainty: 0.25,       // 25%
  directionUncertainty: 15,     // 15度
};

/**
 * 風の不確実性から落下範囲の楕円パラメータを計算
 *
 * @param nominalDrift - 風なし時からの水平移動距離 [m]
 * @param windDirection - 風向 [deg]
 * @param uncertainty - 風の不確実性
 */
export function calculateUncertaintyEllipse(
  nominalDrift: number,
  windDirection: number,
  uncertainty: WindUncertainty = DEFAULT_WIND_UNCERTAINTY
): { semiMajor: number; semiMinor: number; rotation: number } {
  // 風速誤差による長軸（風下方向）
  const semiMajor = nominalDrift * uncertainty.speedUncertainty;

  // 風向誤差による短軸（風に直交方向）
  const dirUncertaintyRad = uncertainty.directionUncertainty * Math.PI / 180;
  const semiMinor = nominalDrift * Math.sin(dirUncertaintyRad);

  // 楕円の回転角は風向に平行
  const rotation = (windDirection + 180) % 360;

  return {
    semiMajor: Math.max(semiMajor, 10),  // 最小10m
    semiMinor: Math.max(semiMinor, 5),   // 最小5m
    rotation,
  };
}

/**
 * 粗度長の目安
 */
export const ROUGHNESS_LENGTHS: Record<string, number> = {
  water: 0.0002,           // 水面
  sand: 0.0003,            // 砂地
  snow: 0.001,             // 雪面
  grass_short: 0.008,      // 短い草地
  grass_tall: 0.03,        // 長い草地
  farmland: 0.05,          // 農地
  suburbs: 0.5,            // 郊外
  urban: 1.0,              // 市街地
  forest: 1.5,             // 森林
};
