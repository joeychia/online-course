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
          'admin': [
            './src/pages/AdminDashboard.tsx',
            './src/pages/AdminQuizResults.tsx',
            './src/components/admin/CourseEditor.tsx',
            './src/components/admin/CourseListItem.tsx',
            './src/components/admin/CourseManagement.tsx',
            './src/components/admin/LessonEditor.tsx',
            './src/components/admin/LessonList.tsx',
            './src/components/admin/QuizEditor.tsx',
            './src/components/admin/StudentsQuizResults.tsx'
          ],
        },
      },
    },
  },
  define: {
    'process.env': process.env
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 3000,
  }
})
