/**
 * 大気モデルのユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  getTemperature,
  getPressure,
  getDensity,
  getSpeedOfSound,
  getGravity,
  getAtmosphericConditions,
  SEA_LEVEL_STANDARD,
  PHYSICAL_CONSTANTS,
} from '../atmosphere';

describe('Atmosphere', () => {
  describe('getTemperature', () => {
    it('returns 288.15K at sea level (standard)', () => {
      expect(getTemperature(0)).toBeCloseTo(288.15, 2);
    });

    it('returns ~216.65K at 11km (tropopause)', () => {
      expect(getTemperature(11000)).toBeCloseTo(216.65, 2);
    });

    it('decreases by 6.5K per 1000m in troposphere', () => {
      const t0 = getTemperature(0);
      const t1000 = getTemperature(1000);
      expect(t0 - t1000).toBeCloseTo(6.5, 1);
    });

    it('uses custom surface temperature when provided', () => {
      // 30°C surface temp
      const temp = getTemperature(0, 30);
      expect(temp).toBeCloseTo(303.15, 2);
    });

    it('stays constant at 216.65K above 11km', () => {
      expect(getTemperature(12000)).toBeCloseTo(216.65, 2);
      expect(getTemperature(15000)).toBeCloseTo(216.65, 2);
    });
  });

  describe('getPressure', () => {
    it('returns 101325Pa at sea level (standard)', () => {
      expect(getPressure(0)).toBeCloseTo(101325, 0);
    });

    it('returns ~22632Pa at 11km', () => {
      // ISA standard value at 11km
      expect(getPressure(11000)).toBeCloseTo(22632, -2);
    });

    it('decreases with altitude', () => {
      expect(getPressure(1000)).toBeLessThan(getPressure(0));
      expect(getPressure(5000)).toBeLessThan(getPressure(1000));
    });

    it('uses custom surface pressure when provided', () => {
      // 1000 hPa surface pressure
      const pressure = getPressure(0, 1000);
      expect(pressure).toBeCloseTo(100000, 0);
    });

    it('is approximately half at 5.5km', () => {
      const p0 = getPressure(0);
      const p55 = getPressure(5500);
      expect(p55 / p0).toBeCloseTo(0.5, 1);
    });
  });

  describe('getDensity', () => {
    it('returns ~1.225 kg/m³ at sea level (standard)', () => {
      expect(getDensity(0)).toBeCloseTo(1.225, 2);
    });

    it('decreases with altitude', () => {
      expect(getDensity(1000)).toBeLessThan(getDensity(0));
      expect(getDensity(5000)).toBeLessThan(getDensity(1000));
    });

    it('returns ~0.36 kg/m³ at 11km', () => {
      expect(getDensity(11000)).toBeCloseTo(0.36, 1);
    });

    it('follows ideal gas law: ρ = P/(R*T)', () => {
      const altitude = 5000;
      const T = getTemperature(altitude);
      const P = getPressure(altitude);
      const expectedDensity = P / (PHYSICAL_CONSTANTS.R * T);
      expect(getDensity(altitude)).toBeCloseTo(expectedDensity, 6);
    });
  });

  describe('getSpeedOfSound', () => {
    it('returns ~340 m/s at sea level', () => {
      expect(getSpeedOfSound(0)).toBeCloseTo(340.3, 0);
    });

    it('decreases with altitude (lower temperature)', () => {
      expect(getSpeedOfSound(5000)).toBeLessThan(getSpeedOfSound(0));
    });

    it('returns ~295 m/s at 11km', () => {
      expect(getSpeedOfSound(11000)).toBeCloseTo(295, 0);
    });
  });

  describe('getGravity', () => {
    it('returns 9.80665 m/s² at sea level', () => {
      expect(getGravity(0)).toBeCloseTo(9.80665, 5);
    });

    it('decreases with altitude (inverse square law)', () => {
      expect(getGravity(1000)).toBeLessThan(getGravity(0));
    });

    it('returns ~9.77 m/s² at 10km', () => {
      // g = g0 * (R/(R+h))^2
      expect(getGravity(10000)).toBeCloseTo(9.775, 2);
    });

    it('change is small for model rocket altitudes (<1km)', () => {
      const gDiff = getGravity(0) - getGravity(1000);
      expect(gDiff).toBeLessThan(0.01);
    });
  });

  describe('getAtmosphericConditions', () => {
    it('returns all properties in a bundle', () => {
      const conditions = getAtmosphericConditions(0);

      expect(conditions.temperature).toBeCloseTo(288.15, 2);
      expect(conditions.pressure).toBeCloseTo(101325, 0);
      expect(conditions.density).toBeCloseTo(1.225, 2);
      expect(conditions.speedOfSound).toBeCloseTo(340.3, 0);
      expect(conditions.gravity).toBeCloseTo(9.80665, 5);
    });

    it('accepts custom surface conditions', () => {
      const conditions = getAtmosphericConditions(0, 30, 1000);

      expect(conditions.temperature).toBeCloseTo(303.15, 2);
      expect(conditions.pressure).toBeCloseTo(100000, 0);
    });
  });

  describe('Constants', () => {
    it('has correct sea level standard values', () => {
      expect(SEA_LEVEL_STANDARD.temperature).toBe(288.15);
      expect(SEA_LEVEL_STANDARD.pressure).toBe(101325);
      expect(SEA_LEVEL_STANDARD.density).toBe(1.225);
    });

    it('has correct physical constants', () => {
      expect(PHYSICAL_CONSTANTS.g0).toBe(9.80665);
      expect(PHYSICAL_CONSTANTS.R).toBeCloseTo(287.05, 1);
    });
  });
});
