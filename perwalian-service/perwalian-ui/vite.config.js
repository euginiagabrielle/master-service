import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend URL - ganti sesuai environment yang dipakai.
// Docker lokal (aktif): http://localhost:8003  (gateway map 8003:8000 di docker-compose.yml)
// AWS EC2:              http://44.201.72.181:8003
const BACKEND_URL = 'http://34.239.155.252:8003';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Semua request /api/* di forward ke backend, bypass CORS
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
