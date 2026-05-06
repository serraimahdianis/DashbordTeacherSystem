"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";

type Locale = "en" | "fr" | "ar";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
  initialDictionary: Dictionary;
  initialLocale: string;
}

export function LocaleProvider({ children, initialDictionary, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>((initialLocale as Locale) || "en");
  const dictionary: Dictionary = initialDictionary;

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = (document.cookie
        .split("; ")
        .find((c) => c.startsWith("locale="))
        ?.split("=")?.[1] || initialLocale) as Locale;
      if (saved !== locale) {
        setLocaleState(saved);
      }
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
    }, 0);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLocale = (newLocale: Locale) => {
    document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setLocaleState(newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
    // Reload to refresh server translations (dictionary is loaded server-side)
    window.location.reload();
  };

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dir, t: dictionary }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

export function useTranslation() {
  const { t, locale, dir } = useLocale();
  return { t, locale, dir };
}
