/**
 * 弾道計算（上昇フェーズ）のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import { calculateAscent } from '../ballistics';
import type { RocketParameters } from '../../types/rocket';

// テスト用のロケットパラメータ
const testRocket: RocketParameters = {
  dryMass: 0.08,           // 80g
  propellantMass: 0.01,    // 10g
  bodyDiameter: 0.025,     // 25mm
  bodyLength: 0.3,         // 30cm
  dragCoefficient: 0.5,
  motorTotalImpulse: 5,    // 5 Ns (A8相当)
  motorBurnTime: 0.5,      // 0.5秒燃焼
  motorDelayTime: 3,       // 3秒遅延
};

describe('Ballistics', () => {
  describe('calculateAscent', () => {
    it('returns trajectory points', () => {
      const result = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      expect(result.trajectoryPoints.length).toBeGreaterThan(0);
    });

    it('starts at launch elevation', () => {
      const result = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 100,
        windSpeed: 0,
        windDirection: 0,
      });

      expect(result.trajectoryPoints[0].position.z).toBe(100);
    });

    it('reaches apogee with near-zero vertical velocity', () => {
      const result = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      const lastPoint = result.trajectoryPoints[result.trajectoryPoints.length - 1];
      // At apogee, vertical velocity should be close to 0 or slightly negative
      expect(lastPoint.velocity.z).toBeLessThan(1);
    });

    it('apogee altitude is reasonable for A-class motor', () => {
      const result = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      // A8 motor should reach ~50-150m depending on rocket weight
      expect(result.apogee.altitude).toBeGreaterThan(30);
      expect(result.apogee.altitude).toBeLessThan(200);
    });

    it('max velocity exceeds burnout velocity', () => {
      const result = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      // Max velocity occurs during thrust phase
      expect(result.maxVelocity).toBeGreaterThanOrEqual(result.burnoutVelocity);
    });

    it('burnout altitude is less than apogee', () => {
      const result = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      expect(result.burnoutAltitude).toBeLessThan(result.apogee.altitude);
    });

    it('trajectory has both thrust and coast phases', () => {
      const result = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      const phases = new Set(result.trajectoryPoints.map(p => p.phase));
      expect(phases.has('thrust')).toBe(true);
      expect(phases.has('coast')).toBe(true);
    });

    it('wind causes horizontal drift', () => {
      const noWindResult = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      const withWindResult = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 5,
        windDirection: 0,  // Wind from north
      });

      // With wind, apogee should be displaced from launch point
      const noWindDrift = Math.sqrt(
        noWindResult.apogee.position.x ** 2 +
        noWindResult.apogee.position.y ** 2
      );
      const withWindDrift = Math.sqrt(
        withWindResult.apogee.position.x ** 2 +
        withWindResult.apogee.position.y ** 2
      );

      expect(withWindDrift).toBeGreaterThan(noWindDrift);
    });

    it('angled launch affects horizontal position', () => {
      const verticalResult = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      const angledResult = calculateAscent({
        rocket: testRocket,
        launchAngle: 85,  // 5 degrees from vertical
        launchAzimuth: 90, // East
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      // Angled launch should have more horizontal displacement
      expect(Math.abs(angledResult.apogee.position.x)).toBeGreaterThan(
        Math.abs(verticalResult.apogee.position.x)
      );
    });

    it('heavier rocket reaches lower altitude', () => {
      const lightRocket = { ...testRocket, dryMass: 0.05 };
      const heavyRocket = { ...testRocket, dryMass: 0.15 };

      const lightResult = calculateAscent({
        rocket: lightRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      const heavyResult = calculateAscent({
        rocket: heavyRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      expect(heavyResult.apogee.altitude).toBeLessThan(lightResult.apogee.altitude);
    });

    it('higher impulse motor reaches higher altitude', () => {
      const lowImpulseRocket = { ...testRocket, motorTotalImpulse: 2.5 };
      const highImpulseRocket = { ...testRocket, motorTotalImpulse: 10 };

      const lowResult = calculateAscent({
        rocket: lowImpulseRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      const highResult = calculateAscent({
        rocket: highImpulseRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      expect(highResult.apogee.altitude).toBeGreaterThan(lowResult.apogee.altitude);
    });

    it('trajectory points have increasing time', () => {
      const result = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
      });

      for (let i = 1; i < result.trajectoryPoints.length; i++) {
        expect(result.trajectoryPoints[i].time).toBeGreaterThanOrEqual(
          result.trajectoryPoints[i - 1].time
        );
      }
    });

    it('uses custom time step', () => {
      const result = calculateAscent({
        rocket: testRocket,
        launchAngle: 90,
        launchAzimuth: 0,
        launchElevation: 0,
        windSpeed: 0,
        windDirection: 0,
        timeStep: 0.01,
      });

      // Should still produce valid results
      expect(result.apogee.altitude).toBeGreaterThan(0);
    });
  });
});
