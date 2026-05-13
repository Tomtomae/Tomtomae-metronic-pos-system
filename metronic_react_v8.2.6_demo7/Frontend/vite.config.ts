import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: "/metronic8/react/demo7/",
  server: {
    port: 3000,
    strictPort: true,
    proxy: {  
      // Your new local backend proxy
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // Keep the old one if you still want to fetch Metronic demo data
      '.*/api-proxy': {
        target: 'https://preview.keenthemes.com/metronic8/demo7/laravel/api',
        changeOrigin: true,
        secure: false,
      },
    },
  },  
  build: {
    chunkSizeWarningLimit: 3000,
  },
})