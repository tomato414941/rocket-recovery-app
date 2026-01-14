/**
 * パラシュート・降下計算
 *
 * 頂点から地上までの降下フェーズを計算
 * - パラシュート降下
 * - ストリーマー降下
 * - 自由落下
 */

import { getDensity, getGravity } from './atmosphere';
import { calculateTerminalVelocity } from './aerodynamics';
import type { RecoveryParameters } from '../types/recovery';
import type { TrajectoryPoint } from '../types/trajectory';

/**
 * 降下計算の入力
 */
export interface DescentInput {
  recovery: RecoveryParameters;
  rocketMass: number;           // 降下質量（空虚質量）[kg]
  rocketDiameter: number;       // 機体直径 [m]（自由落下用）
  rocketCd: number;             // 機体抗力係数（自由落下用）
  startPosition: { x: number; y: number; z: number };
  startVelocity: { x: number; y: number; z: number };
  startTime: number;
  groundLevel: number;          // 地表高度 [m]
  getWindAtAltitude: (altitude: number) => { speed: number; direction: number };
  surfaceTemp?: number;
  surfacePressure?: number;
  timeStep?: number;
}

/**
 * 降下計算の結果
 */
export interface DescentResult {
  trajectoryPoints: TrajectoryPoint[];
  landing: {
    time: number;
    position: { x: number; y: number; z: number };
    velocity: number;
  };
  descentTime: number;
  averageDescentRate: number;
}

/**
 * 回収方式に応じた抗力係数と面積を取得
 */
function getRecoveryDragParams(
  recovery: RecoveryParameters,
  _rocketMass: number,
  rocketDiameter: number,
  rocketCd: number
): { cd: number; area: number } {
  switch (recovery.method) {
    case 'parachute': {
      const diameter = recovery.parachuteDiameter ?? 0.3;
      const cd = recovery.parachuteCd ?? 1.75;
      const area = Math.PI * Math.pow(diameter / 2, 2);
      return { cd, area };
    }
    case 'streamer': {
      const area = recovery.streamerArea ?? 0.01;
      const cd = recovery.streamerCd ?? 1.2;
      return { cd, area };
    }
    case 'freefall':
    default: {
      const area = Math.PI * Math.pow(rocketDiameter / 2, 2);
      return { cd: rocketCd, area };
    }
  }
}

/**
 * 風向から風のベクトル成分を計算
 */
function getWindComponents(windSpeed: number, windDirection: number): { wx: number; wy: number } {
  const windTo = (windDirection + 180) % 360;
  const windRad = windTo * Math.PI / 180;
  return {
    wx: windSpeed * Math.sin(windRad),
    wy: windSpeed * Math.cos(windRad),
  };
}

/**
 * 降下フェーズの軌道計算
 */
export function calculateDescent(input: DescentInput): DescentResult {
  const {
    recovery,
    rocketMass,
    rocketDiameter,
    rocketCd,
    startPosition,
    startVelocity,
    startTime,
    groundLevel,
    getWindAtAltitude,
    surfaceTemp,
    surfacePressure,
    timeStep = 0.05,
  } = input;

  // 回収方式に応じた抗力パラメータ
  const { cd, area } = getRecoveryDragParams(recovery, rocketMass, rocketDiameter, rocketCd);

  // 状態変数
  let x = startPosition.x;
  let y = startPosition.y;
  let z = startPosition.z;
  let vx = startVelocity.x;
  let vy = startVelocity.y;
  let vz = startVelocity.z;
  let t = startTime;

  // 結果格納
  const trajectoryPoints: TrajectoryPoint[] = [];
  let totalDescentRate = 0;
  let descentSamples = 0;

  const maxIterations = 10000;
  let iteration = 0;

  while (z > groundLevel && iteration < maxIterations) {
    // 高度における風
    const wind = getWindAtAltitude(z - groundLevel);
    const { wx, wy } = getWindComponents(wind.speed, wind.direction);

    // 現在の降下速度
    const descentRate = -vz;
    if (descentRate > 0) {
      totalDescentRate += descentRate;
      descentSamples++;
    }

    // 軌道点を記録（0.2秒ごと）
    if (Math.abs(t % 0.2) < timeStep / 2) {
      trajectoryPoints.push({
        time: t,
        position: { x, y, z },
        velocity: { x: vx, y: vy, z: vz },
        phase: 'descent',
      });
    }

    // 対気速度
    const vxRel = vx - wx;
    const vyRel = vy - wy;
    const vzRel = vz;
    const velocityRel = Math.sqrt(vxRel * vxRel + vyRel * vyRel + vzRel * vzRel);

    // 重力
    const g = getGravity(z);

    // 空気密度
    const density = getDensity(z, surfaceTemp, surfacePressure);

    // 抗力
    const drag = 0.5 * density * velocityRel * velocityRel * cd * area;

    // 抗力の方向成分
    let dragX = 0, dragY = 0, dragZ = 0;
    if (velocityRel > 0.01) {
      dragX = drag * vxRel / velocityRel;
      dragY = drag * vyRel / velocityRel;
      dragZ = drag * vzRel / velocityRel;
    }

    // 加速度（抗力は速度と逆向き）
    const ax = -dragX / rocketMass;
    const ay = -dragY / rocketMass;
    const az = -dragZ / rocketMass - g;

    // 状態更新
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
  const landingVelocity = Math.sqrt(vx * vx + vy * vy + vz * vz);
  trajectoryPoints.push({
    time: t,
    position: { x, y, z: groundLevel },
    velocity: { x: vx, y: vy, z: vz },
    phase: 'descent',
  });

  const descentTime = t - startTime;
  const averageDescentRate = descentSamples > 0 ? totalDescentRate / descentSamples : 0;

  return {
    trajectoryPoints,
    landing: {
      time: t,
      position: { x, y, z: groundLevel },
      velocity: landingVelocity,
    },
    descentTime,
    averageDescentRate,
  };
}

/**
 * パラシュートの終端速度を計算（参考値）
 */
export function calculateParachuteTerminalVelocity(
  mass: number,
  parachuteDiameter: number,
  parachuteCd: number = 1.75,
  altitude: number = 0,
  surfaceTemp?: number,
  surfacePressure?: number
): number {
  const area = Math.PI * Math.pow(parachuteDiameter / 2, 2);
  return calculateTerminalVelocity(mass, parachuteCd, area, altitude, surfaceTemp, surfacePressure);
}
