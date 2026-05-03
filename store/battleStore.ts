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
  pendingCapture: NormalisedPokemon | null;
  startBattle: () => Promise<void>;
  playerAttack: (index: number) => Promise<void>;
  captureEnemy: () => Promise<void>;
  declineCapture: () => Promise<void>;
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
  pendingCapture: null,
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

    // --- Player Turn ---
    let canMove = true;
    if (playerBattle.status === 'sleep') {
      if (Math.random() < 0.33) {
        playerBattle.status = 'none';
        set({ log: [...get().log, { attacker: 'player', move: { name: 'woke up', type: 'normal', power: 0, cooldown: 0 }, result: { damage: 0, critical: false, effectiveness: 1 }, targetHp: enemyHp }] });
      } else {
        canMove = false;
        set({ log: [...get().log, { attacker: 'player', move: { name: 'is sleeping', type: 'normal', power: 0, cooldown: 0 }, result: { damage: 0, critical: false, effectiveness: 1 }, targetHp: enemyHp }] });
      }
    } else if (playerBattle.status === 'paralyze') {
      if (Math.random() < 0.25) {
        canMove = false;
        set({ log: [...get().log, { attacker: 'player', move: { name: 'is paralyzed', type: 'normal', power: 0, cooldown: 0 }, result: { damage: 0, critical: false, effectiveness: 1 }, targetHp: enemyHp }] });
      }
    }

    let currentEnemyHp = enemyHp;

    if (canMove) {
      const move = playerMoves[index];
      const result = calculateDamage(playerBattle, enemyBattle, move);
      currentEnemyHp = Math.max(0, enemyHp - result.damage);

      // Apply status to enemy
      if (result.appliedStatus) {
        enemyBattle.status = result.appliedStatus;
      }

      set((state) => ({
        log: [...state.log, { attacker: 'player', move, result, targetHp: currentEnemyHp }],
        enemyHp: currentEnemyHp,
        enemyBattle: { ...enemyBattle } // Trigger update
      }));
    }

    // Check Win
    if (currentEnemyHp <= 0) {
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
      const { team, maxTeamSize } = useTeamStore.getState();
      const canCapture = team.length < maxTeamSize ? get().enemy : null;
      set({ status: 'won', pendingCapture: canCapture });
      return;
    }

    set({ turn: 'enemy' });
    await new Promise((resolve) => setTimeout(resolve, 600));

    // --- Enemy Turn ---
    let enemyCanMove = true;
    if (enemyBattle.status === 'sleep') {
      if (Math.random() < 0.33) {
        enemyBattle.status = 'none';
        set({ log: [...get().log, { attacker: 'enemy', move: { name: 'woke up', type: 'normal', power: 0, cooldown: 0 }, result: { damage: 0, critical: false, effectiveness: 1 }, targetHp: playerHp }] });
      } else {
        enemyCanMove = false;
        set({ log: [...get().log, { attacker: 'enemy', move: { name: 'is sleeping', type: 'normal', power: 0, cooldown: 0 }, result: { damage: 0, critical: false, effectiveness: 1 }, targetHp: playerHp }] });
      }
    } else if (enemyBattle.status === 'paralyze') {
      if (Math.random() < 0.25) {
        enemyCanMove = false;
        set({ log: [...get().log, { attacker: 'enemy', move: { name: 'is paralyzed', type: 'normal', power: 0, cooldown: 0 }, result: { damage: 0, critical: false, effectiveness: 1 }, targetHp: playerHp }] });
      }
    }

    let currentPlayerHp = get().playerHp;

    if (enemyCanMove) {
      const enemyMove = chooseMove(enemyBattle);
      const enemyResult = calculateDamage(enemyBattle, playerBattle, enemyMove);
      currentPlayerHp = Math.max(0, currentPlayerHp - enemyResult.damage);

      // Apply status to player
      if (enemyResult.appliedStatus) {
        playerBattle.status = enemyResult.appliedStatus;
      }

      set((state) => ({
        log: [...state.log, { attacker: 'enemy', move: enemyMove, result: enemyResult, targetHp: currentPlayerHp }],
        playerHp: currentPlayerHp,
        playerBattle: { ...playerBattle }
      }));
    }

    // Update Team HP
    useTeamStore.setState((state) => {
      const newTeam = [...state.team];
      newTeam[0] = { ...newTeam[0], hp: currentPlayerHp };
      return { team: newTeam };
    });

    // Check Loss
    if (currentPlayerHp <= 0) {
      useTeamStore.getState().healTeam(1);
      set({ status: 'lost', turn: 'player' });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await get().nextBattle();
      return;
    }

    // --- End of Round (DoT) ---
    // Player Burn/Poison
    if (playerBattle.status === 'burn' || playerBattle.status === 'poison') {
      const damage = Math.max(1, Math.round(createBattlePokemon(playerBattle.pokemon, playerBattle.level, true).hp / (playerBattle.status === 'poison' ? 8 : 16)));
      currentPlayerHp = Math.max(0, currentPlayerHp - damage);
      set((state) => ({
        log: [...state.log, { attacker: 'player', move: { name: playerBattle.status, type: 'normal', power: 0, cooldown: 0 }, result: { damage, critical: false, effectiveness: 1 }, targetHp: currentPlayerHp }],
        playerHp: currentPlayerHp
      }));
      // Update Team HP
      useTeamStore.setState((state) => {
        const newTeam = [...state.team];
        newTeam[0] = { ...newTeam[0], hp: currentPlayerHp };
        return { team: newTeam };
      });
      if (currentPlayerHp <= 0) {
        useTeamStore.getState().healTeam(1);
        set({ status: 'lost', turn: 'player' });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await get().nextBattle();
        return;
      }
    }

    // Enemy Burn/Poison
    if (enemyBattle.status === 'burn' || enemyBattle.status === 'poison') {
      const damage = Math.max(1, Math.round(createBattlePokemon(enemyBattle.pokemon, enemyBattle.level).hp / (enemyBattle.status === 'poison' ? 8 : 16)));
      currentEnemyHp = Math.max(0, currentEnemyHp - damage);
      set((state) => ({
        log: [...state.log, { attacker: 'enemy', move: { name: enemyBattle.status, type: 'normal', power: 0, cooldown: 0 }, result: { damage, critical: false, effectiveness: 1 }, targetHp: currentEnemyHp }],
        enemyHp: currentEnemyHp
      }));
      if (currentEnemyHp <= 0) {
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
        const { team, maxTeamSize } = useTeamStore.getState();
        const canCapture = team.length < maxTeamSize ? get().enemy : null;
        set({ status: 'won', pendingCapture: canCapture });
        return;
      }
    }

    set({ turn: 'player' });
  },
  captureEnemy: async () => {
    const { enemy, enemyLevel } = get();
    if (!enemy) return;
    await useTeamStore.getState().capturePokemon(enemy, enemyLevel);
    set({ pendingCapture: null });
    await get().nextBattle();
  },
  declineCapture: async () => {
    set({ pendingCapture: null });
    await get().nextBattle();
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
      turn: 'player',
      pendingCapture: null
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
      turn: 'player',
      pendingCapture: null
    });
  }
}));

