'use client';

import { createContext, PropsWithChildren, useContext, useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

interface AudioContextValue {
  playAttack: () => void;
}

const Ctx = createContext<AudioContextValue>({ playAttack: () => {} });

export function useAudio() {
  return useContext(Ctx);
}

export function AudioManager({ children }: PropsWithChildren) {
  const { muted } = useSettingsStore();
  const bgmRef = useRef<HTMLAudioElement>(null);
  const attackRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const bgm = bgmRef.current;
    if (!bgm) return;
    bgm.loop = true;
    if (muted) {
      bgm.pause();
    } else {
      bgm.play().catch(() => undefined);
    }
  }, [muted]);

  const playAttack = () => {
    if (muted) return;
    const el = attackRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => undefined);
  };

  return (
    <Ctx.Provider value={{ playAttack }}>
      <audio ref={bgmRef} src="/levelup.mp3" />
      <audio ref={attackRef} src="/attack.mp3" />
      {children}
    </Ctx.Provider>
  );
}
