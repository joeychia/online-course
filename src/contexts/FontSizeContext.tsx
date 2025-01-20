import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type FontSize = 'small' | 'medium' | 'large';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const fontSizeScales = {
  small: {
    body: '0.875rem',    // 14px
    h1: '1.75rem',       // 28px
    h2: '1.5rem',        // 24px
    h3: '1.25rem',       // 20px
    h4: '1.125rem',      // 18px
    h5: '1rem',          // 16px
    h6: '0.875rem',      // 14px
  },
  medium: {
    body: '1rem',        // 16px
    h1: '2rem',          // 32px
    h2: '1.75rem',       // 28px
    h3: '1.5rem',        // 24px
    h4: '1.25rem',       // 20px
    h5: '1.125rem',      // 18px
    h6: '1rem',          // 16px
  },
  large: {
    body: '1.125rem',    // 18px
    h1: '2.25rem',       // 36px
    h2: '2rem',          // 32px
    h3: '1.75rem',       // 28px
    h4: '1.5rem',        // 24px
    h5: '1.25rem',       // 20px
    h6: '1.125rem',      // 18px
  },
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};

interface FontSizeProviderProps {
  children: ReactNode;
}

export const FontSizeProvider = ({ children }: FontSizeProviderProps) => {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const savedSize = localStorage.getItem('fontSize');
    return (savedSize as FontSize) || 'medium';
  });

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    
    // Apply font sizes to root element
    const scale = fontSizeScales[fontSize];
    document.documentElement.style.setProperty('--font-size-body', scale.body);
    document.documentElement.style.setProperty('--font-size-h1', scale.h1);
    document.documentElement.style.setProperty('--font-size-h2', scale.h2);
    document.documentElement.style.setProperty('--font-size-h3', scale.h3);
    document.documentElement.style.setProperty('--font-size-h4', scale.h4);
    document.documentElement.style.setProperty('--font-size-h5', scale.h5);
    document.documentElement.style.setProperty('--font-size-h6', scale.h6);
  }, [fontSize]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}; 