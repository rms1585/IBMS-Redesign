import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import bn from './bn';

// Bangla and English for every label, chosen per user and kept between sessions (Annex 24.7).
// English is the key; a string without a Bangla entry yet shows in English.
const STORAGE_KEY = 'ibms-language';

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
};

const translate = (lang, s) => (lang === 'bn' && typeof s === 'string' ? bn[s] ?? s : s);

// The language in force, for `tr()` in places that are not hooks (JSX attributes in long screens). The layout
// remounts the screen when the language changes, so those strings are re-read.
let current = readStored();
export const tr = (s) => translate(current, s);

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (s) => s });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStored);
  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* storage unavailable */ }
  }, []);
  current = lang;
  const t = useCallback((s) => translate(lang, s), [lang]);
  // Screen readers pronounce the page in the chosen language (audit M3).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;
