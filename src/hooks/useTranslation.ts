import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

export function useTranslation() {
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

  return { t };
} 