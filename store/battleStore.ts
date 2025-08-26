import { create } from 'zustand';
import { simulateBattle, createBattlePokemon } from '@/lib/battle/engine';
import type { BattleLogEntry } from '@/lib/battle/types';
import { getPokemon, NormalisedPokemon } from '@/lib/pokeapi';
import { useTeamStore } from '@/store/teamStore';
import { usePlayerStore } from '@/store/playerStore';
import { calcCoinsForVictory, calcExperienceForVictory } from '@/lib/progression/progression';
import { useUpgradeStore } from '@/store/upgradeStore';

interface BattleState {
  enemy: NormalisedPokemon | null;
  enemyLevel: number;
  status: 'idle' | 'running' | 'won' | 'lost';
  log: BattleLogEntry[];
  startBattle: () => Promise<void>;
  nextBattle: () => Promise<void>;
  reset: () => void;
}

export const useBattleStore = create<BattleState>((set, get) => ({
  enemy: null,
  enemyLevel: 1,
  status: 'idle',
  log: [],
  startBattle: async () => {
    const { team } = useTeamStore.getState();
    if (!team.length) return;
    const enemy = get().enemy;
    if (!enemy) return;
    set({ status: 'running', log: [] });
    // Create battle participants
    const playerActive = createBattlePokemon(team[0].pokemon, team[0].level);
    const enemyBattle = createBattlePokemon(enemy, get().enemyLevel);
    const outcome = simulateBattle(playerActive, enemyBattle);
    // Update HP of player's active Pokémon
    useTeamStore.setState((state) => {
      const newTeam = [...state.team];
      const baseHp = createBattlePokemon(state.team[0].pokemon, state.team[0].level).hp;
      const remaining = outcome.playerRemainingHp;
      newTeam[0] = { ...newTeam[0], hp: remaining };
      return { team: newTeam };
    });
    // Determine result and reward
    if (outcome.winner === 'player') {
      // Gain XP and coins
      const battleCount = usePlayerStore.getState().victories;
      const isBoss = (battleCount + 1) % 10 === 0;
      const xpGain = calcExperienceForVictory(isBoss, battleCount);
      const coinGain = calcCoinsForVictory(isBoss);
      usePlayerStore.getState().addXp(xpGain);
      usePlayerStore.getState().addCoins(coinGain);
      usePlayerStore.getState().incrementVictories();
      // Heal team partially (30% base + auto-heal upgrade bonus)
      // Heal team based on auto‑heal upgrade level (each level adds +10% to base heal)
      const { levels } = useUpgradeStore.getState();
      const autoHealLevel = levels['auto-heal'];
      const healFraction = 0.3 + autoHealLevel * 0.1;
      useTeamStore.getState().healTeam(healFraction);
      set({ status: 'won', log: outcome.log });
    } else {
      // Player lost
      set({ status: 'lost', log: outcome.log });
    }
  },
  nextBattle: async () => {
    // Generate random enemy and scale level with player's level and victories
    const player = usePlayerStore.getState();
    const id = Math.floor(Math.random() * 150) + 1;
    const enemy = await getPokemon(id);
    const battleCount = player.victories;
    const level = Math.max(1, player.level + Math.floor(battleCount / 5));
    set({ enemy, enemyLevel: level, status: 'idle', log: [] });
  },
  reset: () => {
    set({ enemy: null, enemyLevel: 1, status: 'idle', log: [] });
  }
}));