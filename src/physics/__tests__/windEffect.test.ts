/**
 * 風影響計算のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  createLogLawWindProfile,
  createLayeredWindProfile,
  calculateUncertaintyEllipse,
  DEFAULT_WIND_UNCERTAINTY,
  ROUGHNESS_LENGTHS,
} from '../windEffect';

describe('WindEffect', () => {
  describe('createLogLawWindProfile', () => {
    it('returns reference speed at reference height', () => {
      const profile = createLogLawWindProfile(5, 180, 10, 0.03);
      const wind = profile.getWindAtAltitude(10);
      expect(wind.speed).toBeCloseTo(5, 1);
      expect(wind.direction).toBe(180);
    });

    it('returns higher speed at higher altitude', () => {
      const profile = createLogLawWindProfile(5, 180, 10, 0.03);
      const wind10 = profile.getWindAtAltitude(10);
      const wind50 = profile.getWindAtAltitude(50);
      expect(wind50.speed).toBeGreaterThan(wind10.speed);
    });

    it('returns lower speed near ground', () => {
      const profile = createLogLawWindProfile(5, 180, 10, 0.03);
      const wind10 = profile.getWindAtAltitude(10);
      const wind2 = profile.getWindAtAltitude(2);
      expect(wind2.speed).toBeLessThan(wind10.speed);
    });

    it('never returns negative speed', () => {
      const profile = createLogLawWindProfile(5, 180, 10, 0.03);
      const wind = profile.getWindAtAltitude(0.1);
      expect(wind.speed).toBeGreaterThanOrEqual(0);
    });

    it('maintains wind direction at all altitudes', () => {
      const profile = createLogLawWindProfile(5, 270, 10, 0.03);
      expect(profile.getWindAtAltitude(1).direction).toBe(270);
      expect(profile.getWindAtAltitude(10).direction).toBe(270);
      expect(profile.getWindAtAltitude(100).direction).toBe(270);
    });

    it('higher roughness length gives different speed profile', () => {
      const smoothProfile = createLogLawWindProfile(5, 180, 10, 0.001);
      const roughProfile = createLogLawWindProfile(5, 180, 10, 0.5);

      const windSmooth = smoothProfile.getWindAtAltitude(50);
      const windRough = roughProfile.getWindAtAltitude(50);

      // With same reference speed at ref height, both profiles should
      // produce different but positive speeds at 50m
      expect(windSmooth.speed).toBeGreaterThan(0);
      expect(windRough.speed).toBeGreaterThan(0);
      expect(windSmooth.speed).not.toEqual(windRough.speed);
    });
  });

  describe('createLayeredWindProfile', () => {
    it('returns surface wind when no layers provided', () => {
      const profile = createLayeredWindProfile(5, 180);
      const wind = profile.getWindAtAltitude(100);
      expect(wind.speed).toBe(5);
      expect(wind.direction).toBe(180);
    });

    it('returns surface wind at ground level', () => {
      const profile = createLayeredWindProfile(5, 180, [
        { altitude: 500, windSpeed: 10, windDirection: 200 },
      ]);
      const wind = profile.getWindAtAltitude(0);
      expect(wind.speed).toBe(5);
      expect(wind.direction).toBe(180);
    });

    it('returns top layer wind above all layers', () => {
      const profile = createLayeredWindProfile(5, 180, [
        { altitude: 500, windSpeed: 10, windDirection: 200 },
        { altitude: 1000, windSpeed: 15, windDirection: 220 },
      ]);
      const wind = profile.getWindAtAltitude(2000);
      expect(wind.speed).toBe(15);
      expect(wind.direction).toBe(220);
    });

    it('interpolates speed between layers', () => {
      const profile = createLayeredWindProfile(5, 180, [
        { altitude: 1000, windSpeed: 15, windDirection: 180 },
      ]);
      const wind = profile.getWindAtAltitude(500);
      // Halfway between 5 and 15
      expect(wind.speed).toBeCloseTo(10, 1);
    });

    it('interpolates direction between layers', () => {
      const profile = createLayeredWindProfile(5, 180, [
        { altitude: 1000, windSpeed: 5, windDirection: 200 },
      ]);
      const wind = profile.getWindAtAltitude(500);
      expect(wind.direction).toBeCloseTo(190, 0);
    });

    it('handles direction wrap around 360 degrees', () => {
      const profile = createLayeredWindProfile(5, 350, [
        { altitude: 1000, windSpeed: 5, windDirection: 10 },
      ]);
      const wind = profile.getWindAtAltitude(500);
      // Should interpolate through 0, not go 350->180->10
      expect(wind.direction).toBeCloseTo(0, 0);
    });

    it('handles multiple layers correctly', () => {
      const profile = createLayeredWindProfile(5, 180, [
        { altitude: 500, windSpeed: 8, windDirection: 190 },
        { altitude: 1000, windSpeed: 12, windDirection: 200 },
        { altitude: 2000, windSpeed: 20, windDirection: 210 },
      ]);

      // Between 500m and 1000m
      const wind750 = profile.getWindAtAltitude(750);
      expect(wind750.speed).toBeCloseTo(10, 0);
      expect(wind750.direction).toBeCloseTo(195, 0);
    });
  });

  describe('calculateUncertaintyEllipse', () => {
    it('returns larger semi-major axis for larger drift', () => {
      const ellipse1 = calculateUncertaintyEllipse(100, 180);
      const ellipse2 = calculateUncertaintyEllipse(500, 180);
      expect(ellipse2.semiMajor).toBeGreaterThan(ellipse1.semiMajor);
    });

    it('returns semi-major proportional to drift and speed uncertainty', () => {
      const ellipse = calculateUncertaintyEllipse(400, 180);
      // semiMajor = drift * speedUncertainty = 400 * 0.25 = 100
      expect(ellipse.semiMajor).toBe(100);
    });

    it('returns minimum semi-major of 10m', () => {
      const ellipse = calculateUncertaintyEllipse(10, 180);
      expect(ellipse.semiMajor).toBe(10);
    });

    it('returns minimum semi-minor of 5m', () => {
      const ellipse = calculateUncertaintyEllipse(10, 180);
      expect(ellipse.semiMinor).toBe(5);
    });

    it('rotation is opposite to wind direction', () => {
      const ellipse = calculateUncertaintyEllipse(100, 90);
      // Wind from east (90), ellipse aligned downwind (270)
      expect(ellipse.rotation).toBe(270);
    });

    it('accepts custom uncertainty parameters', () => {
      const customUncertainty = {
        speedUncertainty: 0.5,
        directionUncertainty: 30,
      };
      const ellipse = calculateUncertaintyEllipse(200, 180, customUncertainty);
      // semiMajor = 200 * 0.5 = 100
      expect(ellipse.semiMajor).toBe(100);
    });
  });

  describe('DEFAULT_WIND_UNCERTAINTY', () => {
    it('has expected default values', () => {
      expect(DEFAULT_WIND_UNCERTAINTY.speedUncertainty).toBe(0.25);
      expect(DEFAULT_WIND_UNCERTAINTY.directionUncertainty).toBe(15);
    });
  });

  describe('ROUGHNESS_LENGTHS', () => {
    it('has correct values for common surfaces', () => {
      expect(ROUGHNESS_LENGTHS.water).toBe(0.0002);
      expect(ROUGHNESS_LENGTHS.grass_short).toBe(0.008);
      expect(ROUGHNESS_LENGTHS.urban).toBe(1.0);
    });

    it('roughness increases from water to urban', () => {
      expect(ROUGHNESS_LENGTHS.water).toBeLessThan(ROUGHNESS_LENGTHS.sand);
      expect(ROUGHNESS_LENGTHS.sand).toBeLessThan(ROUGHNESS_LENGTHS.grass_short);
      expect(ROUGHNESS_LENGTHS.grass_short).toBeLessThan(ROUGHNESS_LENGTHS.farmland);
      expect(ROUGHNESS_LENGTHS.farmland).toBeLessThan(ROUGHNESS_LENGTHS.urban);
    });
  });
});
