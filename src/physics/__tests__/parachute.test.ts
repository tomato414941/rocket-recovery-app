/**
 * パラシュート・降下計算のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDescent,
  calculateParachuteTerminalVelocity,
} from '../parachute';
import type { RecoveryParameters } from '../../types/recovery';

// テスト用の回収パラメータ
const parachuteRecovery: RecoveryParameters = {
  method: 'parachute',
  parachuteDiameter: 0.3,  // 30cm
  parachuteCd: 1.75,
};

const streamerRecovery: RecoveryParameters = {
  method: 'streamer',
  streamerArea: 0.02,      // 200cm²
  streamerCd: 1.2,
};

const freefallRecovery: RecoveryParameters = {
  method: 'freefall',
};

// 風プロファイル（一定風速）
const noWind = (_altitude: number) => ({ speed: 0, direction: 0 });
const constantWind = (_altitude: number) => ({ speed: 5, direction: 0 }); // 北から5m/s

describe('Parachute', () => {
  describe('calculateDescent', () => {
    it('returns trajectory points', () => {
      const result = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 5,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      expect(result.trajectoryPoints.length).toBeGreaterThan(0);
    });

    it('lands at ground level', () => {
      const result = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 5,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      expect(result.landing.position.z).toBe(0);
    });

    it('landing time is after start time', () => {
      const result = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 5,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      expect(result.landing.time).toBeGreaterThan(5);
    });

    it('descent time is reasonable for parachute', () => {
      const result = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      // At ~5 m/s descent, 100m takes ~20s
      expect(result.descentTime).toBeGreaterThan(10);
      expect(result.descentTime).toBeLessThan(40);
    });

    it('landing velocity is safe for parachute recovery', () => {
      const result = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      // Safe landing is typically < 6 m/s
      expect(result.landing.velocity).toBeLessThan(8);
    });

    it('streamer descent is faster than parachute', () => {
      const parachuteResult = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      const streamerResult = calculateDescent({
        recovery: streamerRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      expect(streamerResult.descentTime).toBeLessThan(parachuteResult.descentTime);
    });

    it('freefall is faster than streamer', () => {
      const streamerResult = calculateDescent({
        recovery: streamerRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      const freefallResult = calculateDescent({
        recovery: freefallRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      expect(freefallResult.descentTime).toBeLessThan(streamerResult.descentTime);
    });

    it('wind causes horizontal drift', () => {
      const noWindResult = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      const withWindResult = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: constantWind,
      });

      const noWindDrift = Math.sqrt(
        noWindResult.landing.position.x ** 2 +
        noWindResult.landing.position.y ** 2
      );
      const withWindDrift = Math.sqrt(
        withWindResult.landing.position.x ** 2 +
        withWindResult.landing.position.y ** 2
      );

      expect(withWindDrift).toBeGreaterThan(noWindDrift);
    });

    it('all trajectory points are in descent phase', () => {
      const result = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      for (const point of result.trajectoryPoints) {
        expect(point.phase).toBe('descent');
      }
    });

    it('trajectory points have decreasing altitude', () => {
      const result = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      for (let i = 1; i < result.trajectoryPoints.length; i++) {
        expect(result.trajectoryPoints[i].position.z).toBeLessThanOrEqual(
          result.trajectoryPoints[i - 1].position.z
        );
      }
    });

    it('respects ground level parameter', () => {
      const result = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 200 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 100,
        getWindAtAltitude: noWind,
      });

      expect(result.landing.position.z).toBe(100);
    });

    it('heavier rocket descends faster', () => {
      const lightResult = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.05,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      const heavyResult = calculateDescent({
        recovery: parachuteRecovery,
        rocketMass: 0.15,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      expect(heavyResult.descentTime).toBeLessThan(lightResult.descentTime);
    });

    it('larger parachute gives slower descent', () => {
      const smallChute: RecoveryParameters = {
        method: 'parachute',
        parachuteDiameter: 0.2,
        parachuteCd: 1.75,
      };
      const largeChute: RecoveryParameters = {
        method: 'parachute',
        parachuteDiameter: 0.5,
        parachuteCd: 1.75,
      };

      const smallResult = calculateDescent({
        recovery: smallChute,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      const largeResult = calculateDescent({
        recovery: largeChute,
        rocketMass: 0.08,
        rocketDiameter: 0.025,
        rocketCd: 0.5,
        startPosition: { x: 0, y: 0, z: 100 },
        startVelocity: { x: 0, y: 0, z: 0 },
        startTime: 0,
        groundLevel: 0,
        getWindAtAltitude: noWind,
      });

      expect(largeResult.descentTime).toBeGreaterThan(smallResult.descentTime);
    });
  });

  describe('calculateParachuteTerminalVelocity', () => {
    it('returns positive velocity', () => {
      const vt = calculateParachuteTerminalVelocity(0.1, 0.3);
      expect(vt).toBeGreaterThan(0);
    });

    it('returns safe velocity for typical model rocket parachute', () => {
      // 100g rocket, 30cm parachute
      const vt = calculateParachuteTerminalVelocity(0.1, 0.3);
      // Should be around 4-6 m/s
      expect(vt).toBeGreaterThan(3);
      expect(vt).toBeLessThan(8);
    });

    it('larger parachute gives lower terminal velocity', () => {
      const vt1 = calculateParachuteTerminalVelocity(0.1, 0.2);
      const vt2 = calculateParachuteTerminalVelocity(0.1, 0.4);
      expect(vt2).toBeLessThan(vt1);
    });

    it('heavier rocket gives higher terminal velocity', () => {
      const vt1 = calculateParachuteTerminalVelocity(0.05, 0.3);
      const vt2 = calculateParachuteTerminalVelocity(0.15, 0.3);
      expect(vt2).toBeGreaterThan(vt1);
    });

    it('uses custom Cd when provided', () => {
      const vt1 = calculateParachuteTerminalVelocity(0.1, 0.3, 1.5);
      const vt2 = calculateParachuteTerminalVelocity(0.1, 0.3, 2.0);
      // Higher Cd means more drag, lower terminal velocity
      expect(vt2).toBeLessThan(vt1);
    });

    it('terminal velocity is higher at altitude', () => {
      const vtSeaLevel = calculateParachuteTerminalVelocity(0.1, 0.3, 1.75, 0);
      const vt5km = calculateParachuteTerminalVelocity(0.1, 0.3, 1.75, 5000);
      expect(vt5km).toBeGreaterThan(vtSeaLevel);
    });
  });
});
