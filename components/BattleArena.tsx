'use client';

import { useBattleStore } from '@/store/battleStore';
import { useTeamStore } from '@/store/teamStore';
import { ProgressBar } from '@/components/ProgressBar';
import { useTranslate } from '@/hooks/useTranslate';
import Image from 'next/image';
import { motion } from 'framer-motion';

export function BattleArena() {
  const {
    enemy,
    enemyLevel,
    status,
    log,
    startBattle,
    nextBattle,
    playerHp,
    enemyHp
  } = useBattleStore();
  const { team } = useTeamStore();
  const t = useTranslate();
  const player = team[0];
  const playerMaxHp = player ? createMaxHp(player) : 1;
  const enemyMaxHp = enemy ? createMaxHpEnemy(enemy, enemyLevel) : 1;
  const last = log[log.length - 1];
  const enemyHit = last?.attacker === 'player' && status === 'running';
  const playerHit = last?.attacker === 'enemy' && status === 'running';

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Enemy display */}
      {enemy && (
        <div className="flex flex-col items-center">
          <div className="text-center">
            <div className="font-semibold capitalize">{enemy.name}</div>
            <div className="text-xs">
              {t('level')}: {enemyLevel}
            </div>
          </div>
          <motion.div
            className="w-32 h-32 relative"
            animate={enemyHit ? { x: [0, -20, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Image
              src={enemy.sprites.front}
              alt={enemy.name}
              fill
              style={{ objectFit: 'contain' }}
            />
          </motion.div>
          <ProgressBar
            value={enemyHp}
            max={enemyMaxHp}
            color="red"
            className="w-32"
          />
        </div>
      )}
      {/* Arena divider */}
      <div className="h-1 w-full bg-gray-300 dark:bg-gray-600" />
      {/* Player display */}
      {player && (
        <div className="flex flex-col items-center">
          <div className="text-center">
            <div className="font-semibold capitalize">
              {player.pokemon.name}
            </div>
            <div className="text-xs">
              {t('level')}: {player.level}
            </div>
          </div>
          <motion.div
            className="w-32 h-32 relative"
            animate={playerHit ? { x: [0, 20, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Image
              src={player.pokemon.sprites.back}
              alt={player.pokemon.name}
              fill
              style={{ objectFit: 'contain' }}
            />
          </motion.div>
          <ProgressBar
            value={playerHp}
            max={playerMaxHp}
            color="green"
            className="w-32"
          />
        </div>
      )}
      {/* Controls */}
      <div className="mt-4">
        {status === 'idle' && (
          <button
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            onClick={() => startBattle()}
          >
            {t('startGame')}
          </button>
        )}
        {status === 'won' && (
          <button
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            onClick={() => nextBattle()}
          >
            {t('nextBattle')}
          </button>
        )}
      </div>
    </div>
  );
}

// Helpers for computing max HP for player and enemy.
import { createBattlePokemon } from '@/lib/battle/engine';
import { NormalisedPokemon } from '@/lib/pokeapi';

function createMaxHp(member: {
  pokemon: NormalisedPokemon;
  level: number;
  hp: number;
}): number {
  const key = '__maxHp';
  // @ts-ignore
  if (member[key]) return member[key];
  // @ts-ignore
  member[key] = createBattlePokemon(member.pokemon, member.level, true).hp;
  return member[key];
}

function createMaxHpEnemy(pokemon: NormalisedPokemon, level: number): number {
  return createBattlePokemon(pokemon, level).hp;
}
