import { NormalisedPokemon } from '@/lib/pokeapi';
import { BASIC_MOVES, Move } from '@/lib/battle/moves';
import type {
  BattlePokemon,
  DamageResult,
  BattleLogEntry,
  BattleOutcome
} from '@/lib/battle/types';

/** Simplified type effectiveness chart. Values below 1 reduce damage,
 * values above 1 increase damage. Types not listed default to 1.
 * Only the most common types among the first 150 Pokémon are covered.
 */
const typeChart: Record<string, Record<string, number>> = {
  fire: { grass: 2, ice: 2, bug: 2, water: 0.5, rock: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, grass: 0.5, electric: 0.5 },
  grass: { water: 2, ground: 2, rock: 2, fire: 0.5, ice: 0.5, poison: 0.5, flying: 0.5, bug: 0.5 },
  electric: { water: 2, flying: 2, grass: 0.5, ground: 0 },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5 },
  ground: { fire: 2, electric: 2, poison: 2, rock: 2, water: 0.5, grass: 0.5 },
  ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5 },
  fighting: { normal: 2, rock: 2, ice: 2, dark: 2, psychic: 0.5, flying: 0.5 },
  flying: { grass: 2, fighting: 2, bug: 2, rock: 0.5, electric: 0.5 },
  poison: { grass: 2, fairy: 2, ground: 0.5, rock: 0.5, ghost: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5 },
  bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5 },
  ghost: { psychic: 2, ghost: 2, normal: 0 },
  dragon: { dragon: 2 },
  fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5 }
};

/** Returns a list of moves appropriate for the Pokémon's primary type. If
 * no moves are defined for the first type, fallback to normal moves. */
function getMovesForPokemon(pokemon: NormalisedPokemon): Move[] {
  const primaryType = pokemon.types[0] ?? 'normal';
  const moves = BASIC_MOVES[primaryType as keyof typeof BASIC_MOVES];
  return moves ?? BASIC_MOVES['normal'];
}

/** Constructs a BattlePokemon from a normalised Pokémon. Applies simple
 * level scaling to HP. Attack and Defense scaling is handled when
 * calculating damage.
 */
export function createBattlePokemon(
  pokemon: NormalisedPokemon,
  level: number
): BattlePokemon {
  const levelMultiplier = 1 + (level - 1) * 0.02;
  const hp = Math.round(pokemon.stats.hp * levelMultiplier);
  const moves = getMovesForPokemon(pokemon);
  return {
    pokemon,
    hp,
    level,
    cooldowns: new Array(moves.length).fill(0)
  };
}

/** Computes the type effectiveness multiplier for a given move against a
 * Pokémon with potentially multiple types. If any defending type is
 * immune (multiplier 0) the entire effectiveness is 0. Otherwise the
 * multipliers multiply together. */
function getTypeEffectiveness(
  moveType: string,
  defenderTypes: string[]
): number {
  let multiplier = 1;
  for (const type of defenderTypes) {
    const chart = typeChart[moveType];
    const m = chart?.[type] ?? 1;
    multiplier *= m;
  }
  return multiplier;
}

/** Calculates damage and side effects of a move. */
export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move
): DamageResult {
  const atkStat = attacker.pokemon.stats.attack * (1 + (attacker.level - 1) * 0.02);
  const defStat = defender.pokemon.stats.defense * (1 + (defender.level - 1) * 0.02);
  const base = (atkStat / defStat) * move.power;
  // Same type attack bonus
  const stab = attacker.pokemon.types.includes(move.type) ? 1.25 : 1;
  // Type effectiveness
  const effectiveness = getTypeEffectiveness(move.type, defender.pokemon.types);
  // Critical chance: base 10% plus any move specific bonus
  const critChance = 0.1 + (move.critBonus ?? 0);
  const critical = Math.random() < critChance;
  const critMultiplier = critical ? 1.5 : 1;
  // Variation +/-10%
  const variation = 0.9 + Math.random() * 0.2;
  const damage = Math.round(base * stab * effectiveness * critMultiplier * variation);
  return {
    damage: Math.max(1, damage),
    critical,
    effectiveness
  };
}

/** Chooses the best available move for a Pokémon. We pick the move with
 * the highest power that is not on cooldown. In this simplified
 * implementation cooldown is ignored (all moves available every turn).
 */
function chooseMove(pokemon: BattlePokemon): Move {
  const moves = getMovesForPokemon(pokemon.pokemon);
  // Pick highest power move
  return moves.reduce((best, move) => (move.power > best.power ? move : best), moves[0]);
}

/** Simulates a full one‑on‑one battle until either side faints. */
export function simulateBattle(
  player: BattlePokemon,
  enemy: BattlePokemon
): BattleOutcome {
  const log: BattleLogEntry[] = [];
  // Clone HP to avoid mutating original
  let playerHp = player.hp;
  let enemyHp = enemy.hp;
  // Continue until one faints
  while (playerHp > 0 && enemyHp > 0) {
    // Determine turn order: higher speed goes first, tie random
    const playerSpeed = player.pokemon.stats.speed * (1 + (player.level - 1) * 0.02);
    const enemySpeed = enemy.pokemon.stats.speed * (1 + (enemy.level - 1) * 0.02);
    const playerFirst = playerSpeed > enemySpeed || (playerSpeed === enemySpeed && Math.random() < 0.5);
    if (playerFirst) {
      // Player attacks
      const move = chooseMove(player);
      const result = calculateDamage(player, enemy, move);
      enemyHp = Math.max(0, enemyHp - result.damage);
      log.push({ attacker: 'player', move, result, targetHp: enemyHp });
      if (enemyHp <= 0) break;
      // Enemy counterattacks
      const enemyMove = chooseMove(enemy);
      const enemyResult = calculateDamage(enemy, player, enemyMove);
      playerHp = Math.max(0, playerHp - enemyResult.damage);
      log.push({ attacker: 'enemy', move: enemyMove, result: enemyResult, targetHp: playerHp });
    } else {
      // Enemy attacks first
      const enemyMove = chooseMove(enemy);
      const enemyResult = calculateDamage(enemy, player, enemyMove);
      playerHp = Math.max(0, playerHp - enemyResult.damage);
      log.push({ attacker: 'enemy', move: enemyMove, result: enemyResult, targetHp: playerHp });
      if (playerHp <= 0) break;
      // Player counterattacks
      const move = chooseMove(player);
      const result = calculateDamage(player, enemy, move);
      enemyHp = Math.max(0, enemyHp - result.damage);
      log.push({ attacker: 'player', move, result, targetHp: enemyHp });
    }
  }
  return {
    winner: playerHp > 0 ? 'player' : 'enemy',
    log,
    playerRemainingHp: playerHp,
    enemyRemainingHp: enemyHp
  };
}