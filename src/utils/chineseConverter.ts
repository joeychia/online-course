import * as OpenCC from 'opencc-js';

const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });
const reverseConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });

export function convertChinese(text: string, targetLang: 'zh-TW' | 'zh-CN'): string {
  if (!text) return text;
  
  // If target is Traditional Chinese
  if (targetLang === 'zh-TW') {
    return reverseConverter(text);
  }
  
  // If target is Simplified Chinese
  return converter(text);
} 