import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        strictPort: true,
      },
      // Prevent Vite from trying to open the browser automatically
      // since Tauri will handle the window
      clearScreen: false,
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Tauri expects a fixed port to connect to
      build: {
        // Tauri supports es2021
        target: ['es2021', 'chrome100', 'safari13'],
        // Don't minify for debug builds
        minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
        // Produce sourcemaps for debug builds
        sourcemap: !!process.env.TAURI_DEBUG,
        rollupOptions: {
          output: {
            manualChunks: {
              // Split AI services into separate chunks
              'ai-services': ['@google/genai', '@huggingface/transformers'],
              // Split UI components
              'ui-libs': [
                '@radix-ui/react-accordion',
                '@radix-ui/react-dialog',
                '@radix-ui/react-dropdown-menu',
                '@radix-ui/react-slider',
                '@radix-ui/react-tabs',
                '@radix-ui/react-toast',
                '@radix-ui/react-select',
                '@radix-ui/react-dialog'
              ],
              // Split motion and animations
              'animations': ['framer-motion', 'embla-carousel-react'],
              // Split utilities
              'utils': ['class-variance-authority', 'clsx', 'tailwind-merge']
            }
          }
        },
        chunkSizeWarningLimit: 1000
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'framer-motion',
          '@google/genai',
          'lucide-react'
        ]
      }
    };
});
