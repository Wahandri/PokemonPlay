import { create } from 'zustand';
import {
  createBattlePokemon,
  calculateDamage,
  getMovesForPokemon,
  chooseMove
} from '@/lib/battle/engine';
import type { BattleLogEntry, BattlePokemon } from '@/lib/battle/types';
import type { Move } from '@/lib/battle/moves';
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
  /** Moves available for the player's active Pokémon. */
  playerMoves: Move[];
  /** Whose turn is it currently? */
  turn: 'player' | 'enemy';
  /** Internal battle participants. */
  playerBattle: BattlePokemon | null;
  enemyBattle: BattlePokemon | null;
  startBattle: () => Promise<void>;
  playerAttack: (index: number) => Promise<void>;
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
  playerMoves: [],
  turn: 'player',
  playerBattle: null,
  enemyBattle: null,
  startBattle: async () => {
    const { team } = useTeamStore.getState();
    if (!team.length) return;
    const enemy = get().enemy;
    if (!enemy) return;
    // Create battle participants
    const playerBattle = createBattlePokemon(team[0].pokemon, team[0].level, true);
    const enemyBattle = createBattlePokemon(enemy, get().enemyLevel);
    set({
      status: 'running',
      log: [],
      playerHp: playerBattle.hp,
      enemyHp: enemyBattle.hp,
      playerMoves: getMovesForPokemon(team[0].pokemon),
      playerBattle,
      enemyBattle,
      turn: 'player'
    });
  },
  playerAttack: async (index: number) => {
    const {
      playerBattle,
      enemyBattle,
      playerMoves,
      playerHp,
      enemyHp,
      turn,
      status
    } = get();
    if (
      status !== 'running' ||
      turn !== 'player' ||
      !playerBattle ||
      !enemyBattle
    )
      return;
    const move = playerMoves[index];
    const result = calculateDamage(playerBattle, enemyBattle, move);
    const newEnemyHp = Math.max(0, enemyHp - result.damage);
    set((state) => ({
      log: [...state.log, { attacker: 'player', move, result, targetHp: newEnemyHp }],
      enemyHp: newEnemyHp,
      turn: 'enemy'
    }));
    if (newEnemyHp <= 0) {
      // Update team HP
      useTeamStore.setState((state) => {
        const newTeam = [...state.team];
        newTeam[0] = { ...newTeam[0], hp: get().playerHp };
        return { team: newTeam };
      });
      // Rewards
      const battleCount = usePlayerStore.getState().victories;
      const isBoss = (battleCount + 1) % 10 === 0;
      const xpGain = calcExperienceForVictory(isBoss, battleCount);
      const coinGain = calcCoinsForVictory(isBoss);
      usePlayerStore.getState().addXp(xpGain);
      usePlayerStore.getState().addCoins(coinGain);
      usePlayerStore.getState().incrementVictories();
      const { levels } = useUpgradeStore.getState();
      const autoHealLevel = levels['auto-heal'];
      const healFraction = 0.3 + autoHealLevel * 0.1;
      useTeamStore.getState().healTeam(healFraction);
      set({ status: 'won' });
      return;
    }

    // Enemy's turn
    await new Promise((resolve) => setTimeout(resolve, 600));
    const enemyMove = chooseMove(enemyBattle);
    const enemyResult = calculateDamage(enemyBattle, playerBattle, enemyMove);
    const newPlayerHp = Math.max(0, playerHp - enemyResult.damage);
    set((state) => ({
      log: [...state.log, { attacker: 'enemy', move: enemyMove, result: enemyResult, targetHp: newPlayerHp }],
      playerHp: newPlayerHp
    }));
    // Update team HP
    useTeamStore.setState((state) => {
      const newTeam = [...state.team];
      newTeam[0] = { ...newTeam[0], hp: newPlayerHp };
      return { team: newTeam };
    });
    if (newPlayerHp <= 0) {
      useTeamStore.getState().healTeam(1);
      set({ status: 'lost', turn: 'player' });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await get().nextBattle();
    } else {
      set({ turn: 'player' });
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
      enemyHp,
      playerMoves: [],
      playerBattle: null,
      enemyBattle: null,
      turn: 'player'
    });
  },
  reset: () => {
    set({
      enemy: null,
      enemyLevel: 1,
      status: 'idle',
      log: [],
      playerHp: 0,
      enemyHp: 0,
      playerMoves: [],
      playerBattle: null,
      enemyBattle: null,
      turn: 'player'
    });
  }
}));

