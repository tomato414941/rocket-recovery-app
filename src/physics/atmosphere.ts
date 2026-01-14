/**
 * 国際標準大気 (ISA: International Standard Atmosphere) モデル
 *
 * 対流圏（0-11km）における大気特性を計算
 * 参考: ISO 2533:1975
 */

// 物理定数
export const PHYSICAL_CONSTANTS = {
  g0: 9.80665,                  // 標準重力加速度 [m/s²]
  R: 287.05287,                 // 乾燥空気の気体定数 [J/(kg·K)]
  M: 0.0289644,                 // 空気のモル質量 [kg/mol]
  Ru: 8.31447,                  // 普遍気体定数 [J/(mol·K)]
};

// 海面高度での標準大気
export const SEA_LEVEL_STANDARD = {
  temperature: 288.15,          // 温度 [K] (15°C)
  pressure: 101325,             // 気圧 [Pa]
  density: 1.225,               // 密度 [kg/m³]
};

// 対流圏の温度減率
const LAPSE_RATE = -0.0065;     // [K/m]

/**
 * 高度における気温を計算 [K]
 */
export function getTemperature(altitude: number, surfaceTemp?: number): number {
  const T0 = surfaceTemp !== undefined
    ? surfaceTemp + 273.15      // °Cから K
    : SEA_LEVEL_STANDARD.temperature;

  // 対流圏内（11km以下）での計算
  if (altitude < 11000) {
    return T0 + LAPSE_RATE * altitude;
  }

  // 11km以上は成層圏（温度一定 -56.5°C）
  return 216.65;
}

/**
 * 高度における気圧を計算 [Pa]
 */
export function getPressure(altitude: number, surfacePressure?: number): number {
  const P0 = surfacePressure !== undefined
    ? surfacePressure * 100     // hPaからPa
    : SEA_LEVEL_STANDARD.pressure;
  const T0 = SEA_LEVEL_STANDARD.temperature;

  if (altitude < 11000) {
    // 対流圏：気圧高度公式
    const exponent = PHYSICAL_CONSTANTS.g0 / (PHYSICAL_CONSTANTS.R * LAPSE_RATE);
    return P0 * Math.pow(1 + (LAPSE_RATE * altitude) / T0, exponent);
  }

  // 成層圏：等温大気として計算
  const P11 = getPressure(11000, surfacePressure);
  const T11 = 216.65;
  return P11 * Math.exp(-PHYSICAL_CONSTANTS.g0 * (altitude - 11000) / (PHYSICAL_CONSTANTS.R * T11));
}

/**
 * 高度における空気密度を計算 [kg/m³]
 */
export function getDensity(
  altitude: number,
  surfaceTemp?: number,
  surfacePressure?: number
): number {
  const T = getTemperature(altitude, surfaceTemp);
  const P = getPressure(altitude, surfacePressure);

  // 理想気体の状態方程式: ρ = P / (R * T)
  return P / (PHYSICAL_CONSTANTS.R * T);
}

/**
 * 高度における音速を計算 [m/s]
 */
export function getSpeedOfSound(altitude: number, surfaceTemp?: number): number {
  const T = getTemperature(altitude, surfaceTemp);
  const gamma = 1.4;  // 空気の比熱比
  return Math.sqrt(gamma * PHYSICAL_CONSTANTS.R * T);
}

/**
 * 高度における重力加速度を計算 [m/s²]
 * 地球の自転と高度による補正
 */
export function getGravity(altitude: number): number {
  const RE = 6371000;  // 地球半径 [m]
  return PHYSICAL_CONSTANTS.g0 * Math.pow(RE / (RE + altitude), 2);
}

/**
 * 大気特性をまとめて取得
 */
export interface AtmosphericConditions {
  temperature: number;          // [K]
  pressure: number;             // [Pa]
  density: number;              // [kg/m³]
  speedOfSound: number;         // [m/s]
  gravity: number;              // [m/s²]
}

export function getAtmosphericConditions(
  altitude: number,
  surfaceTemp?: number,
  surfacePressure?: number
): AtmosphericConditions {
  return {
    temperature: getTemperature(altitude, surfaceTemp),
    pressure: getPressure(altitude, surfacePressure),
    density: getDensity(altitude, surfaceTemp, surfacePressure),
    speedOfSound: getSpeedOfSound(altitude, surfaceTemp),
    gravity: getGravity(altitude),
  };
}
