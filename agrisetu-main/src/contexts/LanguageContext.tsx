import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language } from "@/i18n/translations";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

const STORAGE_KEY = "agrisetu.lang";

const detectLanguage = (): Language => {
  const saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (saved === "en" || saved === "hi" || saved === "te") return saved;
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("hi")) return "hi";
  if (browserLang.startsWith("te")) return "te";
  return "en";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(detectLanguage());

  const setLang = (l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  };

  // Keep the choice for the whole session across tabs/reloads
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string) => translations[lang]?.[key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
