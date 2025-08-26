import { create } from 'zustand';

interface SettingsState {
  language: 'en' | 'es';
  muted: boolean;
  hydrate: () => void;
  setLanguage: (lang: 'en' | 'es') => void;
  toggleMute: () => void;
  reset: () => void;
}

const STORAGE_KEY = 'pokemon-auto-settings-v1';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'es',
  muted: false,
  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      set({ language: data.language ?? 'es', muted: data.muted ?? false });
    } catch (err) {
      console.error('Failed to hydrate settings', err);
    }
  },
  setLanguage: (lang) => {
    set({ language: lang });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...get(), language: lang })
      );
    }
  },
  toggleMute: () => {
    set((state) => ({ muted: !state.muted }));
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...get(), muted: !get().muted })
      );
    }
  },
  reset: () => {
    set({ language: 'es', muted: false });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}));