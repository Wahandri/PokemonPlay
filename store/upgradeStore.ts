import { create } from 'zustand';
import { UpgradeType, calcUpgradeCost } from '@/lib/progression/progression';
import { usePlayerStore } from '@/store/playerStore';
import { useTeamStore } from '@/store/teamStore';

type UpgradeLevels = Record<UpgradeType, number>;

interface UpgradeState {
  levels: UpgradeLevels;
  purchase: (type: UpgradeType) => void;
  reset: () => void;
}

const DEFAULT_LEVELS: UpgradeLevels = {
  hp: 0,
  attack: 0,
  defense: 0,
  'move-tier': 0,
  'team-slot': 0,
  'auto-heal': 0,
  'xp-gain': 0,
  'coin-gain': 0
};

const STORAGE_KEY = 'pokemon-auto-upgrades-v1';

export const useUpgradeStore = create<UpgradeState>((set, get) => ({
  levels: { ...DEFAULT_LEVELS },
  purchase: (type) => {
    const level = get().levels[type];
    const cost = calcUpgradeCost(type, level);
    const player = usePlayerStore.getState();
    if (player.coins < cost) return;
    // Deduct coins from player
    usePlayerStore.setState({ coins: player.coins - cost });
    // Increase upgrade level
    set((state) => ({ levels: { ...state.levels, [type]: level + 1 } }));
    persist(get());
    // Post purchase effects
    if (type === 'team-slot') {
      // Increase team size via team store
      const teamState = useTeamStore.getState();
      teamState.increaseTeamSize();
    }
  },
  reset: () => {
    set({ levels: { ...DEFAULT_LEVELS } });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}));

function persist(state: UpgradeState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.levels));
}

// Hydrate
if (typeof window !== 'undefined') {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const levels = JSON.parse(raw);
      useUpgradeStore.setState({ levels: { ...DEFAULT_LEVELS, ...levels } });
    } catch (err) {
      console.error('Failed to hydrate upgrades store', err);
    }
  }
}