import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

interface TranslationHook {
  t: (key: string, params?: Record<string, any>) => string;
  language: 'zh-TW' | 'zh-CN';
}

export const useTranslation = (): TranslationHook => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  const { language } = context;

  const t = (key: string, params?: Record<string, any>): string => {
    let translation = translations[key]?.[language as 'zh-TW' | 'zh-CN'] || String(key);
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, String(value));
      });
    }
    
    return translation;
  };

  return { t, language: language as 'zh-TW' | 'zh-CN' };
}; 