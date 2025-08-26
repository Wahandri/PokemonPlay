/**
 * Progression and balancing helpers. These functions centralise the
 * formulas that govern XP gain, coin drops, level thresholds and
 * upgrade costs. Keeping them in one place makes it easier to tune
 * the game without touching the UI or battle code.
 */

/** Returns the XP awarded for defeating an opponent. Bosses grant
 * significantly more XP to feel rewarding. battleCount is the number
 * of completed battles so far (starting at 0). */
export function calcExperienceForVictory(isBoss: boolean, battleCount: number): number {
  const base = isBoss ? 200 : 20;
  // Increase base XP slightly as the player progresses
  return Math.round(base * (1 + battleCount * 0.05));
}

/** Returns the coin reward for defeating an opponent. Bosses grant
 * substantially more coins. */
export function calcCoinsForVictory(isBoss: boolean): number {
  const min = isBoss ? 100 : 10;
  const max = isBoss ? 200 : 20;
  return Math.floor(min + Math.random() * (max - min + 1));
}

/** Given the current total experience points, compute the player's level.
 * Levels scale linearly with a gentle slope. */
export function calcLevelFromXp(xp: number): number {
  // Each level requires 100 XP. Level 1 starts at 0 XP.
  return Math.max(1, Math.floor(xp / 100) + 1);
}

/**
 * Returns an additional HP bonus for the player's Pokémon based on level.
 * Granting some extra health at low levels makes early battles less
 * punishing while still allowing difficulty to scale over time.
 */
export function calcHpBonus(level: number): number {
  return 20 + (level - 1) * 5;
}

export type UpgradeType =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'move-tier'
  | 'team-slot'
  | 'auto-heal'
  | 'xp-gain'
  | 'coin-gain';

/** Returns the cost of purchasing the next level of an upgrade. The cost
 * grows geometrically based on the current level. */
export function calcUpgradeCost(type: UpgradeType, level: number): number {
  const baseCosts: Record<UpgradeType, number> = {
    hp: 50,
    attack: 50,
    defense: 50,
    'move-tier': 100,
    'team-slot': 200,
    'auto-heal': 150,
    'xp-gain': 75,
    'coin-gain': 75
  };
  const growth: Record<UpgradeType, number> = {
    hp: 1.15,
    attack: 1.15,
    defense: 1.15,
    'move-tier': 1.2,
    'team-slot': 1.25,
    'auto-heal': 1.2,
    'xp-gain': 1.2,
    'coin-gain': 1.2
  };
  const base = baseCosts[type] ?? 50;
  const multiplier = growth[type] ?? 1.15;
  return Math.round(base * Math.pow(multiplier, level));
}