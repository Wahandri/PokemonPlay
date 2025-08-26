"use client";

import { useSettingsStore } from '@/store/settingsStore';
import { dictionary, Lang } from '@/lib/i18n';

/**
 * Simple translation hook that reads the current language from
 * settingsStore and returns a translator function. The translator
 * returns the key itself if no translation is found.
 */
export function useTranslate() {
  const lang = useSettingsStore((state) => state.language);
  return (key: string): string => {
    const translations = dictionary[lang as Lang] ?? dictionary.en;
    return translations[key] ?? key;
  };
}