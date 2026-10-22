import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, Fragment, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager, Platform } from 'react-native';

import { de } from './de';
import { DICTS } from './dicts';

/** Struktur aller Texte – vorgegeben durch Deutsch. Werte sind überall Text (bzw. Textlisten). */
type Widen<T> = T extends string ? string : T extends readonly (infer U)[] ? Widen<U>[] : { [K in keyof T]: Widen<T[K]> };
export type Dict = Widen<typeof de>;

export type Lang = 'de' | 'en' | 'tr' | 'ar' | 'ru' | 'uk' | 'pl' | 'sq' | 'ro' | 'sr' | 'fr';

/** Reihenfolge = Anzeige in den Einstellungen. Namen in der jeweiligen Sprache. */
export const LANGUAGES: { code: Lang; name: string; rtl?: boolean }[] = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ar', name: 'العربية', rtl: true },
  { code: 'ru', name: 'Русский' },
  { code: 'uk', name: 'Українська' },
  { code: 'pl', name: 'Polski' },
  { code: 'sq', name: 'Shqip' },
  { code: 'ro', name: 'Română' },
  { code: 'sr', name: 'Srpski' },
  { code: 'fr', name: 'Français' },
];

const KEY = 'zweizuhause.lang';

function isLang(code: string | null | undefined): code is Lang {
  return !!code && LANGUAGES.some((l) => l.code === code);
}

/** Sprache des Handys, falls unterstützt – sonst Deutsch. */
function deviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode;
    return isLang(code) ? code : 'de';
  } catch {
    return 'de';
  }
}

// Für Code außerhalb von React (Erinnerungen, Fehlermeldungen): die zuletzt gewählte Sprache.
let current: Dict = de;
let currentLang: Lang = 'de';

/** Merkt sich die aktive Sprache für Code außerhalb von React – muss vor dem Rendern der Kinder passieren. */
function remember(t: Dict, lang: Lang) {
  current = t;
  currentLang = lang;
}

export function currentT(): Dict {
  return current;
}

export function currentLanguage(): Lang {
  return currentLang;
}

/** Setzt Platzhalter ein: fmt('Hallo {name}', { name: 'Mia' }). */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) => (key in vars ? String(vars[key]) : all));
}

function applyDirection(lang: Lang): boolean {
  const rtl = !!LANGUAGES.find((l) => l.code === lang)?.rtl;
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    return false;
  }
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  // Auf dem Handy wirkt die Schreibrichtung erst nach einem Neustart der App.
  return I18nManager.isRTL !== rtl;
}

interface LanguageState {
  lang: Lang;
  t: Dict;
  /** Liefert true, wenn die App für die Schreibrichtung neu gestartet werden muss. */
  setLang(lang: Lang): Promise<boolean>;
}

const LanguageContext = createContext<LanguageState>({ lang: 'de', t: de, setLang: async () => false });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .catch(() => null)
      .then((saved) => {
        const initial = isLang(saved) ? saved : deviceLang();
        applyDirection(initial);
        setLangState(initial);
      });
  }, []);

  const value = useMemo<LanguageState>(() => {
    const active = lang ?? 'de';
    const t = DICTS[active] ?? de;
    remember(t, active);
    return {
      lang: active,
      t,
      setLang: async (next) => {
        setLangState(next);
        try {
          await AsyncStorage.setItem(KEY, next);
        } catch {
          // Dann gilt beim nächsten Start wieder die Handy-Sprache.
        }
        return applyDirection(next);
      },
    };
  }, [lang]);

  // Bis die gespeicherte Sprache geladen ist, nichts anzeigen – sonst blitzt kurz Deutsch auf.
  if (lang === null) return null;
  // key: beim Sprachwechsel alles neu aufbauen, damit auch Texte außerhalb von useT() wechseln.
  return (
    <LanguageContext.Provider value={value}>
      <Fragment key={lang}>{children}</Fragment>
    </LanguageContext.Provider>
  );
}

/** Alle Texte der gewählten Sprache: const t = useT(); t.home.title */
export function useT(): Dict {
  return useContext(LanguageContext).t;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
