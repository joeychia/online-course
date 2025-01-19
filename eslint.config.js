import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'

export default [
  {
    ignores: [
      'dist/**/*',
      '**/vendor/**',
      '**/node_modules/**',
      'vite.config.ts',
      'vitest.config.ts'
    ]
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        window: true,
        document: true,
        navigator: true,
        setTimeout: true,
        clearTimeout: true,
        setInterval: true,
        clearInterval: true,
        console: true,
        crypto: true,
        localStorage: true,
        sessionStorage: true,
        fetch: true,
        Request: true,
        Response: true,
        Headers: true,
        FormData: true,
        Blob: true,
        File: true,
        FileReader: true,
        URL: true,
        URLSearchParams: true,
        HTMLElement: true,
        Element: true,
        Node: true,
        Event: true,
        MouseEvent: true,
        KeyboardEvent: true,
        CustomEvent: true,
        DOMParser: true,
        XMLHttpRequest: true,
        WebSocket: true,
        performance: true,
        location: true,
        history: true,
        getComputedStyle: true,
        getSelection: true,
        ResizeObserver: true,
        MutationObserver: true,
        IntersectionObserver: true,
        requestAnimationFrame: true,
        cancelAnimationFrame: true,
        Image: true,
        HTMLImageElement: true,
        HTMLCanvasElement: true,
        CanvasRenderingContext2D: true,
        WebGLRenderingContext: true,
        SVGElement: true,
        Promise: true,
        Set: true,
        Map: true,
        WeakMap: true,
        WeakSet: true,
        Proxy: true,
        Reflect: true,
        BigInt: true,
        Intl: true,
        queueMicrotask: true,
        TextEncoder: true,
        TextDecoder: true,
        atob: true,
        btoa: true,
        process: true
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'warn',
      'no-prototype-builtins': 'off'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['src/scripts/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        process: true,
        __dirname: true,
        require: true,
        module: true,
        exports: true,
        Buffer: true,
        console: true,
        setTimeout: true,
        clearTimeout: true,
        setInterval: true,
        clearInterval: true,
        setImmediate: true,
        clearImmediate: true,
        global: true
      }
    }
  },
  {
    files: ['vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.node.json']
      },
      globals: globals.node
    }
  }
]
