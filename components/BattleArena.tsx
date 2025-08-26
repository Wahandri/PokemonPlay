'use client';

import { useBattleStore } from '@/store/battleStore';
import { useTeamStore } from '@/store/teamStore';
import { ProgressBar } from '@/components/ProgressBar';
import { useTranslate } from '@/hooks/useTranslate';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAudio } from '@/components/AudioManager';
import { useEffect } from 'react';

export function BattleArena() {
  const {
    enemy,
    enemyLevel,
    status,
    log,
    startBattle,
    nextBattle,
    playerHp,
    enemyHp,
    playerMoves,
    playerAttack,
    turn,
    pendingCapture,
    captureEnemy,
    declineCapture
  } = useBattleStore();
  const { team } = useTeamStore();
  const t = useTranslate();
  const audio = useAudio();
  const player = team[0];
  const playerMaxHp = player ? createMaxHp(player) : 1;
  const enemyMaxHp = enemy ? createMaxHpEnemy(enemy, enemyLevel) : 1;
  const last = log[log.length - 1];
  const enemyHit = last?.attacker === 'player' && status === 'running';
  const playerHit = last?.attacker === 'enemy' && status === 'running';

  useEffect(() => {
    if (enemyHit || playerHit) {
      audio.playAttack();
    }
  }, [enemyHit, playerHit, audio]);

  const enemyAnimate =
    status === 'won'
      ? { scale: [1, 1.2, 0], opacity: [1, 0] }
      : enemyHit
      ? { x: [0, -20, 0] }
      : {};
  const playerAnimate =
    status === 'lost'
      ? { scale: [1, 0.8, 0], opacity: [1, 0] }
      : playerHit
      ? { x: [0, 20, 0] }
      : {};

  return (
    <div className="relative flex flex-col items-center space-y-4">
      {enemyHit && (
        <motion.div
          key={log.length}
          className="absolute w-4 h-4 bg-yellow-400 rounded-full"
          initial={{ x: -100, y: 60, opacity: 1 }}
          animate={{ x: 100, y: -60, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
      {playerHit && (
        <motion.div
          key={`e${log.length}`}
          className="absolute w-4 h-4 bg-red-400 rounded-full"
          initial={{ x: 100, y: -60, opacity: 1 }}
          animate={{ x: -100, y: 60, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
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
            animate={enemyAnimate}
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
            animate={playerAnimate}
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
      <div className="mt-4 flex flex-col items-center space-y-2">
        {status === 'idle' && (
          <button
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            onClick={() => startBattle()}
          >
            {t('startGame')}
          </button>
        )}
        {status === 'running' && (
          <>
            {turn === 'player' ? (
              <div className="flex flex-wrap justify-center gap-2">
                {playerMoves.map((move, idx) => (
                  <button
                    key={move.name}
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                    onClick={() => playerAttack(idx)}
                  >
                    {move.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="italic">{t('enemyTurn')}</div>
            )}
          </>
        )}
        {status === 'won' && pendingCapture && (
          <div className="flex flex-col items-center space-y-2">
            <div>{t('captureQuestion')}</div>
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                onClick={() => captureEnemy()}
              >
                {t('capture')}
              </button>
              <button
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
                onClick={() => declineCapture()}
              >
                {t('nextBattle')}
              </button>
            </div>
          </div>
        )}
        {status === 'won' && !pendingCapture && (
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
