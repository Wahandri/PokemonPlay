"use client";

import { useTeamStore } from '@/store/teamStore';
import { ProgressBar } from '@/components/ProgressBar';
import { useTranslate } from '@/hooks/useTranslate';

/** Displays the player's team, up to the maximum allowed slots. */
export function TeamPanel() {
  const { team, maxTeamSize } = useTeamStore((s) => ({ team: s.team, maxTeamSize: s.maxTeamSize }));
  const t = useTranslate();
  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-lg mb-2">{t('team')}</h2>
      {team.map((member, idx) => {
        return (
          <div
            key={idx}
            className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded shadow"
          >
            <div className="flex items-center space-x-2">
              <img
                src={member.pokemon.sprites.front}
                alt={member.pokemon.name}
                className="w-8 h-8"
              />
              <div>
                <div className="font-medium capitalize">{member.pokemon.name}</div>
                <div className="text-xs">{t('level')}: {member.level}</div>
              </div>
            </div>
            <div className="w-1/2">
              <ProgressBar value={member.hp} max={createMaxHp(member)} color="green" />
            </div>
          </div>
        );
      })}
      {/* Empty slots */}
      {Array.from({ length: maxTeamSize - team.length }).map((_, idx) => (
        <div
          key={idx}
          className="p-2 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-gray-500"
        >
          Empty
        </div>
      ))}
    </div>
  );
}

// Helper to compute maximum HP for a team member. We call
// createBattlePokemon from the battle engine lazily to avoid heavy
// computation inside React render. This function uses a cache on the
// member object to store the computed max HP.
import { createBattlePokemon } from '@/lib/battle/engine';
function createMaxHp(member: { pokemon: any; level: number; hp: number }): number {
  const key = '__maxHp';
  // @ts-ignore
  if (member[key]) return member[key];
  // compute once
  // @ts-ignore
  member[key] = createBattlePokemon(member.pokemon, member.level, true).hp;
  return member[key];
}