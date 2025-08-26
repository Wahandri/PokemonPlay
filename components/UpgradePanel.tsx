"use client";

import { useUpgradeStore } from '@/store/upgradeStore';
import { usePlayerStore } from '@/store/playerStore';
import { UpgradeType, calcUpgradeCost } from '@/lib/progression/progression';
import { useTranslate } from '@/hooks/useTranslate';

interface UpgradeDef {
  type: UpgradeType;
  nameKey: string;
  description: string;
}

const UPGRADE_DEFS: UpgradeDef[] = [
  { type: 'hp', nameKey: 'HP Boost', description: '+10% max HP' },
  { type: 'attack', nameKey: 'Attack Boost', description: '+10% attack' },
  { type: 'defense', nameKey: 'Defense Boost', description: '+10% defense' },
  { type: 'move-tier', nameKey: 'Move Tier', description: 'Unlock stronger moves' },
  { type: 'team-slot', nameKey: 'Team Slot', description: 'Increase team size' },
  { type: 'auto-heal', nameKey: 'Auto-Heal', description: 'Heal more between battles' },
  { type: 'xp-gain', nameKey: 'XP Gain', description: '+10% XP gained' },
  { type: 'coin-gain', nameKey: 'Coin Gain', description: '+10% coins gained' }
];

export function UpgradePanel() {
  const { levels, purchase } = useUpgradeStore();
  const { coins } = usePlayerStore();
  const t = useTranslate();
  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-lg mb-2">{t('upgrades')}</h2>
      {UPGRADE_DEFS.map((def) => {
        const level = levels[def.type] ?? 0;
        const cost = calcUpgradeCost(def.type, level);
        const affordable = coins >= cost;
        return (
          <div
            key={def.type}
            className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded shadow"
          >
            <div>
              <div className="font-medium">{def.nameKey}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {def.description}
              </div>
              <div className="text-xs">Level: {level}</div>
            </div>
            <button
              className={`px-2 py-1 rounded text-sm ${affordable ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-400 text-gray-100 cursor-not-allowed'}`}
              disabled={!affordable}
              onClick={() => purchase(def.type)}
            >
              {cost} {t('coins')}
            </button>
          </div>
        );
      })}
    </div>
  );
}