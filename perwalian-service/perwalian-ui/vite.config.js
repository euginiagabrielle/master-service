import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend URL - ganti sesuai dengan BitVise SSHnya.
// Untuk Docker lokal: http://localhost:8003
// Untuk AWS EC2:      http://13.220.219.2:8003
const BACKEND_URL = 'http://35.173.47.44:8003';

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
