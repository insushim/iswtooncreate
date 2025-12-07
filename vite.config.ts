import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@google/generative-ai', 'dexie', 'framer-motion', 'zustand'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ai: ['@google/generative-ai'],
          ui: ['framer-motion', 'recharts'],
          storage: ['dexie', 'localforage'],
        },
      },
    },
  },
});
