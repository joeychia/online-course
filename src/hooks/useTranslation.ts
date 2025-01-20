import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

type Language = 'zh-TW' | 'zh-CN';

interface TranslationHook {
  t: (key: keyof typeof translations, params?: Record<string, string | number>) => string;
  language: Language;
}

export function useTranslation(): TranslationHook {
  const { language } = useLanguage();

  const t = (key: keyof typeof translations, params?: Record<string, string | number>) => {
    const translation = translations[key]?.[language] || String(key);
    
    if (!params) {
      return translation;
    }

    return Object.entries(params).reduce(
      (text, [key, value]) => text.replace(`{${key}}`, String(value)),
      translation
    );
  };

  return { t, language };
} 