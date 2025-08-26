import type { NormalisedPokemon } from '@/lib/pokeapi';
import type { Move } from '@/lib/battle/moves';

/** A Pokémon participating in battle along with runtime state such as HP. */
export interface BattlePokemon {
  pokemon: NormalisedPokemon;
  /** Current HP in battle. */
  hp: number;
  /** Level (impacts damage scaling). */
  level: number;
  /** Remaining cooldown turns for each move (index aligned to move list). */
  cooldowns: number[];
}

/** Details about a single damage event. */
export interface DamageResult {
  damage: number;
  critical: boolean;
  effectiveness: number;
}

/** A single turn action logged in the battle log. */
export interface BattleLogEntry {
  attacker: 'player' | 'enemy';
  move: Move;
  result: DamageResult;
  targetHp: number;
}

/** The outcome of a completed battle. */
export interface BattleOutcome {
  winner: 'player' | 'enemy';
  log: BattleLogEntry[];
  playerRemainingHp: number;
  enemyRemainingHp: number;
}