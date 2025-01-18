import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
  define: {
    'process.env': {}
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 3000,
  },
  // Handle environment variable replacement in HTML
  experimental: {
    renderBuiltUrl(filename: string, { hostType }: { hostType: 'js' | 'css' | 'html' }) {
      if (hostType === 'html') {
        return {
          runtime: `import.meta.env.${filename.toUpperCase()}`
        };
      }
    }
  }
})
