"use client";

import { BattleLogEntry } from '@/lib/battle/types';
import { useTranslate } from '@/hooks/useTranslate';

interface LogPanelProps {
  log: BattleLogEntry[];
}

/**
 * Displays a compact battle log. Each line summarises a single attack
 * event. Critical hits and super effective hits are emphasised.
 */
export function LogPanel({ log }: LogPanelProps) {
  const t = useTranslate();
  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
      <div className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs font-semibold uppercase">
        {t('battleLog')}
      </div>
      <div className="flex-1 overflow-y-auto p-2 text-sm space-y-1 font-mono">
        {log.map((entry, idx) => {
          const isPlayer = entry.attacker === 'player';
          const crit = entry.result.critical;
          const eff = entry.result.effectiveness;
          const messages: string[] = [];
          messages.push(
            `${isPlayer ? 'You' : 'Enemy'} used ${entry.move.name} and dealt ${entry.result.damage}`
          );
          if (crit) messages.push('CRIT!');
          if (eff > 1) messages.push('Super effective');
          if (eff > 0 && eff < 1) messages.push('Not very effective');
          return (
            <div
              key={idx}
              className={
                isPlayer
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-red-700 dark:text-red-300'
              }
            >
              {messages.join(' · ')}
            </div>
          );
        })}
      </div>
    </div>
  );
}