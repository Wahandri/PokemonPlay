"use client";

import { PropsWithChildren, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Providers component is used to perform client‑side only hydration
 * tasks, such as loading persisted state from localStorage or
 * configuring global side effects. This component should be kept
 * lightweight as it wraps the entire application.
 */
export function Providers({ children }: PropsWithChildren) {
  // On first load, hydrate settings from localStorage. Other slices
  // implement their own hydration internally when imported.
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  return <>{children}</>;
}