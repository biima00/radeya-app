'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Locale } from './types';
import { DEFAULT_LOCALE } from './types';
import type { Dictionary } from './dictionaries/id';
import id from './dictionaries/id';
import en from './dictionaries/en';
import zh from './dictionaries/zh';

const dictionaries: Record<Locale, Dictionary> = { id, en, zh };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: id,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = localStorage.getItem('radeya_lang') as Locale | null;
    if (saved && dictionaries[saved]) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('radeya_lang', newLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, t: dictionaries[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
