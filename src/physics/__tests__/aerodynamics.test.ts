/**
 * 空気力学計算のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDrag,
  getEffectiveCd,
  calculateTerminalVelocity,
  calculateDynamicPressure,
  calculateReynoldsNumber,
} from '../aerodynamics';

describe('Aerodynamics', () => {
  describe('calculateDrag', () => {
    it('returns 0 when velocity is 0', () => {
      expect(calculateDrag(0, 0.5, 0.01, 0)).toBe(0);
    });

    it('returns positive drag for positive velocity', () => {
      const drag = calculateDrag(50, 0.5, 0.01, 0);
      expect(drag).toBeGreaterThan(0);
    });

    it('drag is proportional to v²', () => {
      const drag1 = calculateDrag(10, 0.5, 0.01, 0);
      const drag2 = calculateDrag(20, 0.5, 0.01, 0);
      // v² ratio is 4, so drag should be ~4x
      expect(drag2 / drag1).toBeCloseTo(4, 1);
    });

    it('drag is proportional to Cd', () => {
      const drag1 = calculateDrag(50, 0.5, 0.01, 0);
      const drag2 = calculateDrag(50, 1.0, 0.01, 0);
      expect(drag2 / drag1).toBeCloseTo(2, 5);
    });

    it('drag is proportional to reference area', () => {
      const drag1 = calculateDrag(50, 0.5, 0.01, 0);
      const drag2 = calculateDrag(50, 0.5, 0.02, 0);
      expect(drag2 / drag1).toBeCloseTo(2, 5);
    });

    it('drag decreases with altitude (lower density)', () => {
      const dragSeaLevel = calculateDrag(50, 0.5, 0.01, 0);
      const drag5km = calculateDrag(50, 0.5, 0.01, 5000);
      expect(drag5km).toBeLessThan(dragSeaLevel);
    });

    it('matches expected value at sea level', () => {
      // D = 0.5 * 1.225 * 100² * 0.5 * 0.01 = 30.625 N
      const drag = calculateDrag(100, 0.5, 0.01, 0);
      expect(drag).toBeCloseTo(30.625, 0);
    });
  });

  describe('getEffectiveCd', () => {
    it('returns base Cd at low Mach numbers', () => {
      // At sea level, speed of sound ~340 m/s
      // 100 m/s => Mach ~0.29
      expect(getEffectiveCd(0.5, 100, 0)).toBeCloseTo(0.5, 5);
    });

    it('returns base Cd at Mach 0.5', () => {
      // ~170 m/s at sea level
      expect(getEffectiveCd(0.5, 170, 0)).toBeCloseTo(0.5, 5);
    });

    it('increases Cd in transonic region (Mach 0.8-1.2)', () => {
      // ~280 m/s at sea level => Mach ~0.82
      const effectiveCd = getEffectiveCd(0.5, 290, 0);
      expect(effectiveCd).toBeGreaterThan(0.5);
    });

    it('returns 1.2x Cd at supersonic speeds', () => {
      // ~450 m/s at sea level => Mach ~1.3
      const effectiveCd = getEffectiveCd(0.5, 450, 0);
      expect(effectiveCd).toBeCloseTo(0.6, 1);
    });

    it('accounts for altitude (lower sound speed)', () => {
      // At 10km, temperature is lower, sound speed is lower
      // Same velocity gives higher Mach number
      const cdSeaLevel = getEffectiveCd(0.5, 270, 0);
      const cd10km = getEffectiveCd(0.5, 270, 10000);
      // At 10km, this velocity is closer to Mach 0.9
      expect(cd10km).toBeGreaterThan(cdSeaLevel);
    });
  });

  describe('calculateTerminalVelocity', () => {
    it('returns reasonable terminal velocity for model rocket with parachute', () => {
      // 0.1 kg rocket with 30cm parachute (Cd=1.75)
      const area = Math.PI * 0.15 ** 2; // ~0.07 m²
      const vt = calculateTerminalVelocity(0.1, 1.75, area, 0);
      // Should be around 4-6 m/s for safe recovery
      expect(vt).toBeGreaterThan(3);
      expect(vt).toBeLessThan(8);
    });

    it('terminal velocity increases with mass', () => {
      const area = Math.PI * 0.15 ** 2;
      const vt1 = calculateTerminalVelocity(0.1, 1.75, area, 0);
      const vt2 = calculateTerminalVelocity(0.2, 1.75, area, 0);
      expect(vt2).toBeGreaterThan(vt1);
      // vt ∝ sqrt(m), so vt2/vt1 ≈ sqrt(2)
      expect(vt2 / vt1).toBeCloseTo(Math.sqrt(2), 1);
    });

    it('terminal velocity decreases with larger area', () => {
      const vt1 = calculateTerminalVelocity(0.1, 1.75, 0.01, 0);
      const vt2 = calculateTerminalVelocity(0.1, 1.75, 0.02, 0);
      expect(vt2).toBeLessThan(vt1);
    });

    it('terminal velocity increases at altitude (lower density)', () => {
      const area = Math.PI * 0.15 ** 2;
      const vtSeaLevel = calculateTerminalVelocity(0.1, 1.75, area, 0);
      const vt5km = calculateTerminalVelocity(0.1, 1.75, area, 5000);
      expect(vt5km).toBeGreaterThan(vtSeaLevel);
    });
  });

  describe('calculateDynamicPressure', () => {
    it('returns 0 when velocity is 0', () => {
      expect(calculateDynamicPressure(0, 0)).toBe(0);
    });

    it('dynamic pressure is proportional to v²', () => {
      const q1 = calculateDynamicPressure(10, 0);
      const q2 = calculateDynamicPressure(20, 0);
      expect(q2 / q1).toBeCloseTo(4, 5);
    });

    it('matches expected value at sea level', () => {
      // q = 0.5 * 1.225 * 100² = 6125 Pa
      const q = calculateDynamicPressure(100, 0);
      expect(q).toBeCloseTo(6125, 0);
    });

    it('decreases with altitude', () => {
      const qSeaLevel = calculateDynamicPressure(100, 0);
      const q5km = calculateDynamicPressure(100, 5000);
      expect(q5km).toBeLessThan(qSeaLevel);
    });
  });

  describe('calculateReynoldsNumber', () => {
    it('returns 0 when velocity is 0', () => {
      expect(calculateReynoldsNumber(0, 0.05, 0)).toBe(0);
    });

    it('Reynolds number is proportional to velocity', () => {
      const re1 = calculateReynoldsNumber(10, 0.05, 0);
      const re2 = calculateReynoldsNumber(20, 0.05, 0);
      expect(re2 / re1).toBeCloseTo(2, 1);
    });

    it('Reynolds number is proportional to length', () => {
      const re1 = calculateReynoldsNumber(50, 0.05, 0);
      const re2 = calculateReynoldsNumber(50, 0.10, 0);
      expect(re2 / re1).toBeCloseTo(2, 1);
    });

    it('returns reasonable value for model rocket', () => {
      // 50 m/s, 5cm diameter at sea level
      const re = calculateReynoldsNumber(50, 0.05, 0);
      // Should be in the 10^5 range
      expect(re).toBeGreaterThan(1e5);
      expect(re).toBeLessThan(1e6);
    });
  });
});
