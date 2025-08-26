import { describe, it, expect, vi } from 'vitest';
import { calculateDamage } from '@/lib/battle/engine';
import { createBattlePokemon } from '@/lib/battle/engine';
import type { NormalisedPokemon } from '@/lib/pokeapi';
import { BASIC_MOVES } from '@/lib/battle/moves';

// Helper to build fake Pokémon with specified stats
function buildPokemon(overrides: Partial<NormalisedPokemon>): NormalisedPokemon {
  return {
    id: 1,
    name: 'bulbasaur',
    types: ['grass'],
    stats: {
      hp: 45,
      attack: 49,
      defense: 49,
      specialAttack: 65,
      specialDefense: 65,
      speed: 45
    },
    sprites: { front: '', back: '' },
    moves: [],
    ...overrides
  } as NormalisedPokemon;
}

describe('damage calculation', () => {
  it('should calculate base damage with STAB and effectiveness', () => {
    const attacker = buildPokemon({ types: ['fire'], stats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65 } });
    const defender = buildPokemon({ types: ['grass'], stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 } });
    const battleAttacker = createBattlePokemon(attacker, 1);
    const battleDefender = createBattlePokemon(defender, 1);
    const move = { name: 'ember', type: 'fire', power: 40, cooldown: 0 };
    // Mock Math.random to control variation and crit chance
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = calculateDamage(battleAttacker, battleDefender, move);
    expect(result.damage).toBeGreaterThan(0);
    expect(result.effectiveness).toBe(2);
    randomSpy.mockRestore();
  });
});