import { describe, it, expect } from 'vitest';
import { calcUpgradeCost } from '@/lib/progression/progression';

describe('upgrade cost scaling', () => {
  it('should grow geometrically for hp upgrade', () => {
    const level0 = calcUpgradeCost('hp', 0);
    const level1 = calcUpgradeCost('hp', 1);
    const level2 = calcUpgradeCost('hp', 2);
    expect(level1).toBeGreaterThan(level0);
    expect(level2).toBeGreaterThan(level1);
  });
});