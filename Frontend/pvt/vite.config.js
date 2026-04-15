import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
      '/api': 'http://localhost:4000',
      '/orders': 'http://localhost:4000',
      '/products': 'http://localhost:4000',
    },
  },
})
