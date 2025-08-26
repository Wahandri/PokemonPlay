import { create } from 'zustand';
import { getPokemon, NormalisedPokemon } from '@/lib/pokeapi';
import { createBattlePokemon } from '@/lib/battle/engine';
import { usePlayerStore } from '@/store/playerStore';

interface TeamMember {
  pokemon: NormalisedPokemon;
  level: number;
  hp: number;
}

interface TeamState {
  team: TeamMember[];
  maxTeamSize: number;
  activeIndex: number;
  setStarter: (id: number, level: number) => Promise<void>;
  addPokemon: (id: number, level: number) => Promise<void>;
  capturePokemon: (pokemon: NormalisedPokemon, level: number) => Promise<void>;
  healTeam: (fraction: number) => void;
  increaseTeamSize: () => void;
  reset: () => void;
}

const STORAGE_KEY = 'pokemon-auto-team-v1';

export const useTeamStore = create<TeamState>((set, get) => ({
  team: [],
  maxTeamSize: 1,
  activeIndex: 0,
  setStarter: async (id, level) => {
    const pokemon = await getPokemon(id);
    const battleMon = createBattlePokemon(pokemon, level, true);
    set({
      team: [
        {
          pokemon,
          level,
          hp: battleMon.hp
        }
      ],
      activeIndex: 0
    });
    persist(get());
  },
  addPokemon: async (id, level) => {
    const { team, maxTeamSize } = get();
    if (team.length >= maxTeamSize) return;
    const pokemon = await getPokemon(id);
    const battleMon = createBattlePokemon(pokemon, level, true);
    set({ team: [...team, { pokemon, level, hp: battleMon.hp }] });
    persist(get());
  },
  capturePokemon: async (pokemon, level) => {
    const { team, maxTeamSize } = get();
    if (team.length >= maxTeamSize) return;
    const battleMon = createBattlePokemon(pokemon, level, true);
    set({ team: [...team, { pokemon, level, hp: battleMon.hp }] });
    usePlayerStore.getState().addCoins(-5);
    usePlayerStore.getState().addXp(-10);
    persist(get());
  },
  healTeam: (fraction) => {
    set((state) => {
      const newTeam = state.team.map((member) => {
        const baseHp = createBattlePokemon(member.pokemon, member.level, true).hp;
        const healed = Math.min(baseHp, member.hp + baseHp * fraction);
        return { ...member, hp: healed };
      });
      return { team: newTeam };
    });
    persist(get());
  },
  increaseTeamSize: () => {
    set((state) => ({ maxTeamSize: Math.min(6, state.maxTeamSize + 1) }));
    persist(get());
  },
  reset: () => {
    set({ team: [], maxTeamSize: 1, activeIndex: 0 });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}));

// Persistence functions
function persist(state: TeamState) {
  if (typeof window === 'undefined') return;
  const data = {
    team: state.team.map((m) => ({
      id: m.pokemon.id,
      level: m.level,
      hp: m.hp
    })),
    maxTeamSize: state.maxTeamSize,
    activeIndex: state.activeIndex
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

if (typeof window !== 'undefined') {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      // Lazy load Pokémon details; we cannot await here so we bootstrap
      // synchronously with placeholders and hydrate asynchronously below.
      useTeamStore.setState((state) => ({
        maxTeamSize: data.maxTeamSize ?? 1,
        activeIndex: data.activeIndex ?? 0
      }));
      // For each stored team member, fetch details in the background.
      (async () => {
        const members: TeamMember[] = [];
        for (const item of data.team ?? []) {
          try {
            const poke = await getPokemon(item.id);
            members.push({ pokemon: poke, level: item.level, hp: item.hp });
          } catch (err) {
            console.error('Failed to hydrate Pokémon', item.id, err);
          }
        }
        useTeamStore.setState(() => ({ team: members }));
      })();
    } catch (err) {
      console.error('Failed to hydrate team store', err);
    }
  }
}