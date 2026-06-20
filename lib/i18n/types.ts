export type Locale = 'id' | 'en' | 'zh';

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export const DEFAULT_LOCALE: Locale = 'id';
