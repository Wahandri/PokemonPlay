/**
 * Small wrapper around the public PokeAPI to fetch only the
 * Pokémon we need. This module exposes helper functions for
 * retrieving Pokémon stats and normalised data structures. It also
 * implements a simple in‑memory cache to avoid duplicate requests
 * during the lifetime of a node process. When used in Next.js,
 * requests are automatically cached by the framework.
 */
export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonMove {
  move: {
    name: string;
    url: string;
  };
}

export interface RawPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: PokemonType[];
  stats: PokemonStat[];
  sprites: {
    front_default: string | null;
    back_default: string | null;
    [key: string]: any;
  };
  moves: PokemonMove[];
}

export interface StatLine {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface NormalisedPokemon {
  id: number;
  name: string;
  types: string[];
  stats: StatLine;
  sprites: {
    front: string;
    back: string;
  };
  moves: string[];
}

const pokemonCache = new Map<number, NormalisedPokemon>();

/**
 * Normalises the raw PokeAPI response into our own shape.
 */
function normalisePokemon(raw: RawPokemon): NormalisedPokemon {
  const statMap: any = {};
  for (const s of raw.stats) {
    statMap[s.stat.name] = s.base_stat;
  }
  return {
    id: raw.id,
    name: raw.name,
    types: raw.types.map((t) => t.type.name),
    stats: {
      hp: statMap['hp'] ?? 1,
      attack: statMap['attack'] ?? 1,
      defense: statMap['defense'] ?? 1,
      specialAttack: statMap['special-attack'] ?? 1,
      specialDefense: statMap['special-defense'] ?? 1,
      speed: statMap['speed'] ?? 1
    },
    sprites: {
      front: raw.sprites.front_default ?? '',
      back: raw.sprites.back_default ?? ''
    },
    moves: raw.moves.slice(0, 10).map((m) => m.move.name)
  };
}

/**
 * Fetches a Pokémon by id (1–150). Throws an error if out of range.
 * The result is cached in memory and also cached by Next.js when
 * called on the server. If this function is called in a browser
 * environment multiple times with the same id, it will reuse the
 * cached value.
 */
export async function getPokemon(id: number): Promise<NormalisedPokemon> {
  if (id < 1 || id > 150) {
    throw new Error('Only Pokémon 1–150 are supported');
  }
  if (pokemonCache.has(id)) {
    return pokemonCache.get(id)!;
  }
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, {
    next: { revalidate: 60 * 60 * 24 }, // revalidate once per day
    cache: 'force-cache'
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Pokémon ${id}`);
  }
  const data: RawPokemon = await res.json();
  const normalised = normalisePokemon(data);
  pokemonCache.set(id, normalised);
  return normalised;
}

/**
 * Preloads a set of Pokémon by id. Useful for prefetching the
 * first 150 Pokémon at build time or during idle periods. This
 * function is rate‑limited by the calling code; it simply loops
 * sequentially to avoid saturating the API.
 */
export async function preloadPokemon(ids: number[]): Promise<void> {
  for (const id of ids) {
    try {
      await getPokemon(id);
    } catch (err) {
      console.error('Failed to preload Pokémon', id, err);
    }
  }
}