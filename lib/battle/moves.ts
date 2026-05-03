export interface Move {
  name: string;
  type: string;
  power: number;
  cooldown: number; // in turns
  critBonus?: number; // additive critical chance (default 0)
  statusEffect?: 'burn' | 'paralyze' | 'sleep' | 'poison';
  statusChance?: number; // 0-1
}

// Define generic moves for each primary type used in the first 150 Pokémon.
export const BASIC_MOVES: Record<string, Move[]> = {
  normal: [
    { name: 'tackle', type: 'normal', power: 40, cooldown: 0 },
    { name: 'slash', type: 'normal', power: 60, cooldown: 1, critBonus: 0.1 },
    { name: 'body-slam', type: 'normal', power: 85, cooldown: 2, statusEffect: 'paralyze', statusChance: 0.3 }
  ],
  fire: [
    { name: 'ember', type: 'fire', power: 40, cooldown: 0, statusEffect: 'burn', statusChance: 0.1 },
    { name: 'flame-wheel', type: 'fire', power: 60, cooldown: 1, statusEffect: 'burn', statusChance: 0.1 }
  ],
  water: [
    { name: 'water-gun', type: 'water', power: 40, cooldown: 0 },
    { name: 'bubble-beam', type: 'water', power: 60, cooldown: 1 }
  ],
  grass: [
    { name: 'vine-whip', type: 'grass', power: 45, cooldown: 0 },
    { name: 'razor-leaf', type: 'grass', power: 55, cooldown: 1, critBonus: 0.1 },
    { name: 'sleep-powder', type: 'grass', power: 0, cooldown: 3, statusEffect: 'sleep', statusChance: 0.75 }
  ],
  electric: [
    { name: 'thunder-shock', type: 'electric', power: 40, cooldown: 0, statusEffect: 'paralyze', statusChance: 0.1 },
    { name: 'spark', type: 'electric', power: 60, cooldown: 1, statusEffect: 'paralyze', statusChance: 0.3 }
  ],
  fighting: [
    { name: 'karate-chop', type: 'fighting', power: 50, cooldown: 0, critBonus: 0.1 },
    { name: 'rock-smash', type: 'fighting', power: 60, cooldown: 1 }
  ],
  rock: [
    { name: 'rock-throw', type: 'rock', power: 50, cooldown: 0 },
    { name: 'rock-slide', type: 'rock', power: 75, cooldown: 2 }
  ],
  ground: [
    { name: 'mud-slap', type: 'ground', power: 40, cooldown: 0 },
    { name: 'earthquake', type: 'ground', power: 80, cooldown: 2 }
  ],
  ice: [
    { name: 'ice-shard', type: 'ice', power: 40, cooldown: 0 },
    { name: 'ice-beam', type: 'ice', power: 65, cooldown: 1, statusEffect: 'sleep', statusChance: 0.1 }
  ],
  poison: [
    { name: 'acid', type: 'poison', power: 40, cooldown: 0, statusEffect: 'poison', statusChance: 0.1 },
    { name: 'sludge', type: 'poison', power: 65, cooldown: 1, statusEffect: 'poison', statusChance: 0.3 }
  ],
  psychic: [
    { name: 'confusion', type: 'psychic', power: 50, cooldown: 0, statusEffect: 'paralyze', statusChance: 0.1 },
    { name: 'psybeam', type: 'psychic', power: 65, cooldown: 1, statusEffect: 'paralyze', statusChance: 0.1 }
  ],
  flying: [
    { name: 'gust', type: 'flying', power: 40, cooldown: 0 },
    { name: 'wing-attack', type: 'flying', power: 60, cooldown: 1 }
  ],
  ghost: [
    { name: 'lick', type: 'ghost', power: 30, cooldown: 0, statusEffect: 'paralyze', statusChance: 0.3 },
    { name: 'shadow-punch', type: 'ghost', power: 60, cooldown: 1 }
  ],
  bug: [
    { name: 'bug-bite', type: 'bug', power: 40, cooldown: 0 },
    { name: 'x-scissor', type: 'bug', power: 65, cooldown: 1 }
  ],
  dragon: [
    { name: 'dragon-breath', type: 'dragon', power: 60, cooldown: 1, statusEffect: 'paralyze', statusChance: 0.3 }
  ],
  fairy: [
    { name: 'fairy-wind', type: 'fairy', power: 40, cooldown: 0 },
    { name: 'dazzling-gleam', type: 'fairy', power: 70, cooldown: 1 }
  ]
};