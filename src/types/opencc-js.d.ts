declare module 'opencc-js' {
  interface ConverterOptions {
    from: 'tw' | 'cn';
    to: 'tw' | 'cn';
  }

  export function Converter(options: ConverterOptions): (text: string) => string;
} 