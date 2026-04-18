import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    open: true,
    proxy: {
      // Proxy backend API
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  esbuild: {
    // Menghapus semua console.log di production agar kode sangat bersih dan ringan
    drop: ['console', 'debugger'],
  },
  build: {
    chunkSizeWarningLimit: 1500,
    // Minify with terser for smaller bundles
    target: 'es2020',
    modulePreload: {
      // Disable polyfill to prevent preloading admin-only chunks (recharts) on user pages
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor libraries into separate chunks for better caching
          if (id.includes('node_modules/react-dom')) return 'react-dom';
          if (id.includes('node_modules/react')) return 'react';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) return 'charts';
          if (id.includes('node_modules/react-router')) return 'router';
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  }
})
