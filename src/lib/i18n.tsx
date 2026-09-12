import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { translateTexts } from "./translate.functions";
import { STATIC_DICTIONARY } from "./i18n-dictionary";

export type LanguageOption = { code: string; label: string; name: string; speech: string };

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", name: "English", speech: "en-US" },
  { code: "ta", label: "தமிழ்", name: "Tamil", speech: "ta-IN" },
  { code: "hi", label: "हिन्दी", name: "Hindi", speech: "hi-IN" },
  { code: "te", label: "తెలుగు", name: "Telugu", speech: "te-IN" },
  { code: "kn", label: "ಕನ್ನಡ", name: "Kannada", speech: "kn-IN" },
  { code: "ml", label: "മലയാളം", name: "Malayalam", speech: "ml-IN" },
  { code: "bn", label: "বাংলা", name: "Bengali", speech: "bn-IN" },
  { code: "mr", label: "मराठी", name: "Marathi", speech: "mr-IN" },
  { code: "ur", label: "اردو", name: "Urdu", speech: "ur-PK" },
  { code: "ar", label: "العربية", name: "Arabic", speech: "ar-SA" },
  { code: "es", label: "Español", name: "Spanish", speech: "es-ES" },
  { code: "fr", label: "Français", name: "French", speech: "fr-FR" },
  { code: "de", label: "Deutsch", name: "German", speech: "de-DE" },
  { code: "pt", label: "Português", name: "Portuguese", speech: "pt-BR" },
  { code: "ru", label: "Русский", name: "Russian", speech: "ru-RU" },
  { code: "zh", label: "中文", name: "Chinese (Simplified)", speech: "zh-CN" },
  { code: "ja", label: "日本語", name: "Japanese", speech: "ja-JP" },
  { code: "ko", label: "한국어", name: "Korean", speech: "ko-KR" },
  { code: "id", label: "Bahasa Indonesia", name: "Indonesian", speech: "id-ID" },
  { code: "sw", label: "Kiswahili", name: "Swahili", speech: "sw-KE" },
];

const STORAGE_KEY = "ecoderm-language";

type LanguageContextValue = {
  language: LanguageOption;
  setLanguageCode: (code: string) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((item) => item.code === stored)) setCode(stored);
  }, []);

  const setLanguageCode = useCallback((next: string) => {
    setCode(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      language: LANGUAGES.find((item) => item.code === code) ?? LANGUAGES[0]!,
      setLanguageCode,
    }),
    [code, setLanguageCode],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

function getCachedTranslation(text: string, langCode: string): string | null {
  if (langCode === "en") return text;
  const staticMatch = STATIC_DICTIONARY[langCode]?.[text];
  if (staticMatch) return staticMatch;
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(`ecoderm_i18n_${langCode}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        if (parsed[text]) return parsed[text];
      }
    } catch {
      // ignore JSON parse errors
    }
  }
  return null;
}

function saveCachedTranslations(langCode: string, newEntries: Record<string, string>) {
  if (typeof window === "undefined" || langCode === "en") return;
  try {
    const key = `ecoderm_i18n_${langCode}`;
    const existing = window.localStorage.getItem(key);
    const parsed = existing ? (JSON.parse(existing) as Record<string, string>) : {};
    const merged = { ...parsed, ...newEntries };
    window.localStorage.setItem(key, JSON.stringify(merged));
  } catch {
    // ignore quota errors
  }
}

/**
 * Translates a fixed list of strings into the active language and returns a
 * lookup function. English passes through untouched (no AI call).
 * Uses static dictionaries & localStorage cache for instant (0ms) translations,
 * fetching uncached terms via Gemini in the background.
 */
export function useTranslate(texts: string[]) {
  const { language } = useLanguage();
  const translate = useServerFn(translateTexts);

  // Filter non-empty unique strings
  const source = useMemo(() => {
    const unique = Array.from(new Set(texts.map((t) => t.trim()).filter((t) => t.length > 0)));
    return unique;
  }, [texts]);

  // Find strings that are NOT in dictionary or local storage yet
  const uncachedSource = useMemo(() => {
    if (language.code === "en") return [];
    return source.filter((text) => !getCachedTranslation(text, language.code));
  }, [source, language.code]);

  const query = useQuery({
    queryKey: ["translate", language.code, uncachedSource],
    enabled: language.code !== "en" && uncachedSource.length > 0,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    queryFn: async () => {
      const map = new Map<string, string>();
      try {
        const result = await translate({
          data: { texts: uncachedSource, targetLanguage: language.name },
        });
        const newRecord: Record<string, string> = {};
        uncachedSource.forEach((text, index) => {
          const translated = result.items[index] ?? text;
          map.set(text, translated);
          newRecord[text] = translated;
        });
        saveCachedTranslations(language.code, newRecord);
      } catch (err) {
        console.warn("Translation request error:", err);
      }
      return map;
    },
  });

  const t = useCallback(
    (text: string) => {
      if (language.code === "en" || !text) return text;
      // 1. Instant check from cache / static dictionary
      const cached = getCachedTranslation(text, language.code);
      if (cached) return cached;
      // 2. Check query data from background fetch
      const queryResult = query.data?.get(text);
      if (queryResult) return queryResult;
      // 3. Fallback to original text
      return text;
    },
    [language.code, query.data],
  );

  return { t, isTranslating: query.isFetching, language };
}

/** Speaks text aloud in the active language using the browser voice engine. */
export function speakText(text: string, locale: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  const voices = window.speechSynthesis.getVoices();
  const match =
    voices.find((voice) => voice.lang.replace("_", "-") === locale) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2)));
  if (match) utterance.voice = match;
  utterance.rate = 0.98;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
