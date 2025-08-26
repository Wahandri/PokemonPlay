"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamStore } from '@/store/teamStore';
import { useBattleStore } from '@/store/battleStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUpgradeStore } from '@/store/upgradeStore';
import { BattleArena } from '@/components/BattleArena';
import { LogPanel } from '@/components/LogPanel';
import { TeamPanel } from '@/components/TeamPanel';
import { UpgradePanel } from '@/components/UpgradePanel';
import { ProgressBar } from '@/components/ProgressBar';
import { useTranslate } from '@/hooks/useTranslate';

export default function GamePage() {
  const router = useRouter();
  const { team, setStarter } = useTeamStore();
  const { enemy, nextBattle, status, log } = useBattleStore();
  const player = usePlayerStore();
  const settings = useSettingsStore();
  const t = useTranslate();
  const [selecting, setSelecting] = useState(false);
  const [choices, setChoices] = useState<number[]>([]);

  // If no team yet, start the selection overlay on mount
  useEffect(() => {
    if (team.length === 0 && !selecting) {
      startSelection();
    }
  }, [team.length]);

  // Ensure an enemy exists when arriving on the page after having a team
  useEffect(() => {
    if (team.length > 0 && !enemy && status === 'idle') {
      nextBattle();
    }
  }, [team.length, enemy, status]);

  function startSelection() {
    const ids: number[] = [];
    while (ids.length < 3) {
      const id = Math.floor(Math.random() * 150) + 1;
      if (!ids.includes(id)) ids.push(id);
    }
    setChoices(ids);
    setSelecting(true);
  }

  async function chooseStarter(id: number) {
    await setStarter(id, 1);
    setSelecting(false);
    await nextBattle();
  }

  // Settings handlers
  function toggleMute() {
    settings.toggleMute();
  }
  function switchLanguage() {
    settings.setLanguage(settings.language === 'en' ? 'es' : 'en');
  }
  function resetProgress() {
    if (typeof window !== 'undefined' && window.confirm('Reset all progress?')) {
      settings.reset();
      usePlayerStore.getState().reset();
      useTeamStore.getState().reset();
      useUpgradeStore.getState().reset();
      useBattleStore.getState().reset();
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white dark:bg-gray-900 shadow">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            {t('level')}: {player.level}
          </div>
          <div className="text-sm flex items-center space-x-2">
            <span>
              {t('experience')}: {player.xp}
            </span>
            <ProgressBar
              value={player.xp - (player.level - 1) * 100}
              max={100}
              color="yellow"
              className="w-24"
            />
          </div>
          <div className="text-sm">
            {t('coins')}: {player.coins}
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <button
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
            onClick={toggleMute}
          >
            {settings.muted ? t('unmute') : t('mute')}
          </button>
          <button
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
            onClick={switchLanguage}
          >
            {t('language')}: {settings.language.toUpperCase()}
          </button>
          <button
            className="px-2 py-1 bg-red-500 text-white rounded"
            onClick={resetProgress}
          >
            {t('reset')}
          </button>
        </div>
      </header>
      {/* Main content grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
        {/* Log panel */}
        <div className="md:col-span-1">
          <LogPanel log={log} />
        </div>
        {/* Battle arena */}
        <div className="md:col-span-2 flex flex-col items-center">
          <BattleArena />
        </div>
        {/* Sidebar: upgrades and team */}
        <div className="md:col-span-1 space-y-4">
          <UpgradePanel />
          <TeamPanel />
        </div>
      </div>
      {/* Starter selection overlay */}
      <AnimatePresence>
        {selecting && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="p-8 bg-white dark:bg-gray-900 rounded-lg shadow flex flex-col items-center space-y-4">
              <div className="text-xl font-semibold">{t('choose your starter')}</div>
              <div className="flex space-x-4">
                {choices.map((id) => (
                  <button key={id} onClick={() => chooseStarter(id)} className="flex flex-col items-center">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                      alt="pokemon"
                      className="w-20 h-20 object-contain"
                    />
                    <span>#{id}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}