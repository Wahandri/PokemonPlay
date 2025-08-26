import { create } from 'zustand';
import { calcLevelFromXp } from '@/lib/progression/progression';

interface PlayerState {
  xp: number;
  coins: number;
  victories: number;
  level: number;
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  incrementVictories: () => void;
  reset: () => void;
}

const STORAGE_KEY = 'pokemon-auto-player-v1';

export const usePlayerStore = create<PlayerState>((set, get) => ({
  xp: 0,
  coins: 0,
  victories: 0,
  level: 1,
  addXp: (amount) => {
    const newXp = get().xp + amount;
    const newLevel = calcLevelFromXp(newXp);
    set({ xp: newXp, level: newLevel });
    if (typeof window !== 'undefined') {
      persist({ xp: newXp, coins: get().coins, victories: get().victories });
    }
  },
  addCoins: (amount) => {
    const newCoins = get().coins + amount;
    set({ coins: newCoins });
    if (typeof window !== 'undefined') {
      persist({ xp: get().xp, coins: newCoins, victories: get().victories });
    }
  },
  incrementVictories: () => {
    const v = get().victories + 1;
    set({ victories: v });
    if (typeof window !== 'undefined') {
      persist({ xp: get().xp, coins: get().coins, victories: v });
    }
  },
  reset: () => {
    set({ xp: 0, coins: 0, victories: 0, level: 1 });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}));

// Persistence helper
function persist(data: { xp: number; coins: number; victories: number }) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Hydrate from localStorage on module import. This must run on the
// client; Next.js will strip this out of server builds because of
// window.localStorage usage.
if (typeof window !== 'undefined') {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      usePlayerStore.setState((state) => ({
        xp: parsed.xp ?? 0,
        coins: parsed.coins ?? 0,
        victories: parsed.victories ?? 0,
        level: calcLevelFromXp(parsed.xp ?? 0)
      }));
    } catch (err) {
      console.error('Failed to hydrate player store', err);
    }
  }
}