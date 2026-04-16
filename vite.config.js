import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
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
    // Mempecah bundle kodingan pihak ketiga (library) agar cache browser pengguna lebih optimal
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react']
        }
      }
    }
  }
})

