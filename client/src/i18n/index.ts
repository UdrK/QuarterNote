import { ref, computed } from 'vue';
import en from './locales/en.json';
import it from './locales/it.json';

export type Locale = 'en' | 'it';

export const availableLocales: { id: Locale; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'it', name: 'Italiano' },
];

const messages: Record<Locale, Record<string, any>> = { en, it };

export const currentLocale = ref<Locale>('en');

export function initI18n(): void {
  const saved = localStorage.getItem('quarter_note_locale') as Locale | null;
  if (saved && (saved === 'en' || saved === 'it')) {
    currentLocale.value = saved;
  }
}

export function setLocale(locale: Locale): void {
  currentLocale.value = locale;
  localStorage.setItem('quarter_note_locale', locale);
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = messages[currentLocale.value] || messages.en;
  const parts = key.split('.');
  
  let val: any = dict;
  for (const part of parts) {
    if (val && typeof val === 'object' && part in val) {
      val = val[part];
    } else {
      // Fallback to english
      val = undefined;
      break;
    }
  }

  if (val === undefined) {
    let fallbackVal: any = messages.en;
    for (const part of parts) {
      if (fallbackVal && typeof fallbackVal === 'object' && part in fallbackVal) {
        fallbackVal = fallbackVal[part];
      } else {
        return key;
      }
    }
    val = fallbackVal;
  }

  if (typeof val !== 'string') {
    return key;
  }

  if (params) {
    return val.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
  }

  return val;
}
