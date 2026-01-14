/**
 * 弾道計算（上昇フェーズ）
 *
 * 2自由度弾道モデルによる数値積分
 * - 推力フェーズ（燃焼中）
 * - 慣性上昇フェーズ（燃焼後〜頂点）
 */

import { getGravity } from './atmosphere';
import { calculateDrag } from './aerodynamics';
import type { RocketParameters } from '../types/rocket';
import type { TrajectoryPoint } from '../types/trajectory';

/**
 * 上昇フェーズ計算の入力
 */
export interface AscentInput {
  rocket: RocketParameters;
  launchAngle: number;          // 発射角度 [deg]（鉛直=90）
  launchAzimuth: number;        // 発射方位 [deg]（北=0）
  launchElevation: number;      // 発射地点標高 [m]
  windSpeed: number;            // 風速 [m/s]
  windDirection: number;        // 風向 [deg]（風が来る方向）
  surfaceTemp?: number;         // 地上気温 [°C]
  surfacePressure?: number;     // 地上気圧 [hPa]
  timeStep?: number;            // 時間刻み [s]
}

/**
 * 上昇フェーズ計算の結果
 */
export interface AscentResult {
  trajectoryPoints: TrajectoryPoint[];
  apogee: {
    time: number;
    altitude: number;
    position: { x: number; y: number; z: number };
  };
  maxVelocity: number;
  burnoutAltitude: number;
  burnoutVelocity: number;
}

/**
 * 風向から風のベクトル成分を計算
 * 風向は「風が吹いてくる方向」なので、移動方向は逆
 */
function getWindComponents(windSpeed: number, windDirection: number): { wx: number; wy: number } {
  // 風向を「風が吹いていく方向」に変換（+180度）
  const windTo = (windDirection + 180) % 360;
  const windRad = windTo * Math.PI / 180;

  return {
    wx: windSpeed * Math.sin(windRad),  // 東方向成分
    wy: windSpeed * Math.cos(windRad),  // 北方向成分
  };
}

/**
 * 上昇フェーズの軌道計算
 */
export function calculateAscent(input: AscentInput): AscentResult {
  const {
    rocket,
    launchAngle,
    launchAzimuth,
    launchElevation,
    windSpeed,
    windDirection,
    surfaceTemp,
    surfacePressure,
    timeStep = 0.02,
  } = input;

  // 初期化
  const referenceArea = Math.PI * Math.pow(rocket.bodyDiameter / 2, 2);
  const averageThrust = rocket.motorTotalImpulse / rocket.motorBurnTime;

  // 発射角度をラジアンに変換
  const launchAngleRad = launchAngle * Math.PI / 180;
  const launchAzimuthRad = launchAzimuth * Math.PI / 180;

  // 初期速度方向（発射台の向き）
  const initialVx = Math.sin(launchAzimuthRad) * Math.cos(launchAngleRad);
  const initialVy = Math.cos(launchAzimuthRad) * Math.cos(launchAngleRad);
  const initialVz = Math.sin(launchAngleRad);

  // 風のベクトル成分
  const { wx, wy } = getWindComponents(windSpeed, windDirection);

  // 状態変数
  let x = 0;      // 東方向位置 [m]
  let y = 0;      // 北方向位置 [m]
  let z = launchElevation;  // 高度 [m]
  let vx = 0;     // 東方向速度 [m/s]
  let vy = 0;     // 北方向速度 [m/s]
  let vz = 0;     // 鉛直速度 [m/s]
  let t = 0;      // 時刻 [s]

  // 質量（燃焼中は減少）
  let mass = rocket.dryMass + rocket.propellantMass;
  const massFlowRate = rocket.propellantMass / rocket.motorBurnTime;

  // 結果格納
  const trajectoryPoints: TrajectoryPoint[] = [];
  let maxVelocity = 0;
  let burnoutAltitude = 0;
  let burnoutVelocity = 0;

  // 数値積分（4次Runge-Kutta法の簡易版として前進オイラー法を使用）
  const maxIterations = 10000;
  let iteration = 0;

  while (iteration < maxIterations) {
    // 現在の速度の大きさ
    const velocity = Math.sqrt(vx * vx + vy * vy + vz * vz);
    maxVelocity = Math.max(maxVelocity, velocity);

    // 対気速度（風の影響）
    const vxRel = vx - wx;
    const vyRel = vy - wy;
    const vzRel = vz;
    const velocityRel = Math.sqrt(vxRel * vxRel + vyRel * vyRel + vzRel * vzRel);

    // フェーズ判定
    const isBurning = t < rocket.motorBurnTime;
    const phase: 'thrust' | 'coast' | 'descent' = isBurning ? 'thrust' : 'coast';

    // 軌道点を記録（0.1秒ごと）
    if (Math.abs(t % 0.1) < timeStep / 2 || t === 0) {
      trajectoryPoints.push({
        time: t,
        position: { x, y, z },
        velocity: { x: vx, y: vy, z: vz },
        phase,
      });
    }

    // 頂点到達判定
    if (vz < 0 && z > launchElevation + 1) {
      break;
    }

    // 重力
    const g = getGravity(z);

    // 抗力
    const drag = velocityRel > 0.1
      ? calculateDrag(velocityRel, rocket.dragCoefficient, referenceArea, z, surfaceTemp, surfacePressure)
      : 0;

    // 抗力の方向（対気速度の逆方向）
    let dragX = 0, dragY = 0, dragZ = 0;
    if (velocityRel > 0.1) {
      dragX = -drag * vxRel / velocityRel;
      dragY = -drag * vyRel / velocityRel;
      dragZ = -drag * vzRel / velocityRel;
    }

    // 推力（燃焼中のみ）
    let thrustX = 0, thrustY = 0, thrustZ = 0;
    if (isBurning) {
      // 推力方向は速度方向（初期は発射台方向）
      if (velocity > 0.1) {
        thrustX = averageThrust * vx / velocity;
        thrustY = averageThrust * vy / velocity;
        thrustZ = averageThrust * vz / velocity;
      } else {
        // 初期状態は発射台の向き
        thrustX = averageThrust * initialVx;
        thrustY = averageThrust * initialVy;
        thrustZ = averageThrust * initialVz;
      }
      // 質量減少
      mass -= massFlowRate * timeStep;
    }

    // 燃焼終了時の状態を記録
    if (!isBurning && burnoutAltitude === 0) {
      burnoutAltitude = z - launchElevation;
      burnoutVelocity = velocity;
    }

    // 加速度
    const ax = (thrustX + dragX) / mass;
    const ay = (thrustY + dragY) / mass;
    const az = (thrustZ + dragZ) / mass - g;

    // 状態更新（前進オイラー法）
    vx += ax * timeStep;
    vy += ay * timeStep;
    vz += az * timeStep;
    x += vx * timeStep;
    y += vy * timeStep;
    z += vz * timeStep;
    t += timeStep;

    iteration++;
  }

  // 最終点を追加
  const finalPoint: TrajectoryPoint = {
    time: t,
    position: { x, y, z },
    velocity: { x: vx, y: vy, z: vz },
    phase: 'coast',
  };
  trajectoryPoints.push(finalPoint);

  return {
    trajectoryPoints,
    apogee: {
      time: t,
      altitude: z - launchElevation,
      position: { x, y, z },
    },
    maxVelocity,
    burnoutAltitude,
    burnoutVelocity,
  };
}
