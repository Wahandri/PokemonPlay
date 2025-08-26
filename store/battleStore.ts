import { create } from 'zustand';
import { simulateBattle, createBattlePokemon } from '@/lib/battle/engine';
import type { BattleLogEntry } from '@/lib/battle/types';
import { getPokemon, NormalisedPokemon } from '@/lib/pokeapi';
import { useTeamStore } from '@/store/teamStore';
import { usePlayerStore } from '@/store/playerStore';
import {
  calcCoinsForVictory,
  calcExperienceForVictory
} from '@/lib/progression/progression';
import { useUpgradeStore } from '@/store/upgradeStore';

interface BattleState {
  enemy: NormalisedPokemon | null;
  enemyLevel: number;
  status: 'idle' | 'running' | 'won' | 'lost';
  log: BattleLogEntry[];
  /** Current HP values for rendering during battle. */
  playerHp: number;
  enemyHp: number;
  startBattle: () => Promise<void>;
  nextBattle: () => Promise<void>;
  reset: () => void;
}

export const useBattleStore = create<BattleState>((set, get) => ({
  enemy: null,
  enemyLevel: 1,
  status: 'idle',
  log: [],
  playerHp: 0,
  enemyHp: 0,
  startBattle: async () => {
    const { team } = useTeamStore.getState();
    if (!team.length) return;
    const enemy = get().enemy;
    if (!enemy) return;
    set({ status: 'running', log: [] });
    // Create battle participants
    const playerActive = createBattlePokemon(team[0].pokemon, team[0].level);
    const enemyBattle = createBattlePokemon(enemy, get().enemyLevel);
    // Initialise HP for animation
    set({ playerHp: playerActive.hp, enemyHp: enemyBattle.hp });
    const outcome = simulateBattle(playerActive, enemyBattle);
    // Replay log with delay for visual effect
    for (const entry of outcome.log) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (entry.attacker === 'player') {
        set((state) => ({
          log: [...state.log, entry],
          enemyHp: entry.targetHp
        }));
      } else {
        set((state) => ({
          log: [...state.log, entry],
          playerHp: entry.targetHp
        }));
      }
    }
    // Update HP of player's active Pokémon
    useTeamStore.setState((state) => {
      const newTeam = [...state.team];
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
      // Heal team based on auto‑heal upgrade level (each level adds +10% to base heal)
      const { levels } = useUpgradeStore.getState();
      const autoHealLevel = levels['auto-heal'];
      const healFraction = 0.3 + autoHealLevel * 0.1;
      useTeamStore.getState().healTeam(healFraction);
      set({ status: 'won' });
    } else {
      // Player lost
      set({ status: 'lost' });
    }
  },
  nextBattle: async () => {
    // Pick enemy based on player's level for smoother difficulty curve
    const player = usePlayerStore.getState();
    const tier = Math.min(2, Math.floor((player.level - 1) / 5));
    const rangeStart = tier * 50 + 1;
    const rangeEnd = rangeStart + 49;
    const id =
      Math.floor(Math.random() * (rangeEnd - rangeStart + 1)) + rangeStart;
    const enemy = await getPokemon(id);
    const battleCount = player.victories;
    const level = Math.max(1, player.level + Math.floor(battleCount / 5));
    const { team } = useTeamStore.getState();
    const playerHp = team[0] ? team[0].hp : 0;
    const enemyHp = createBattlePokemon(enemy, level).hp;
    set({
      enemy,
      enemyLevel: level,
      status: 'idle',
      log: [],
      playerHp,
      enemyHp
    });
  },
  reset: () => {
    set({
      enemy: null,
      enemyLevel: 1,
      status: 'idle',
      log: [],
      playerHp: 0,
      enemyHp: 0
    });
  }
}));
