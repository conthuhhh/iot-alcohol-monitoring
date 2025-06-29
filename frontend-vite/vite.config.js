import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Khi chạy production (serve bởi backend), không cần proxy này. Chỉ dùng khi dev.
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'ws://localhost:4000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@/iotproject': '/src',
      '@/backend': '../iot-alcohol-backend'
    }
  }
})
