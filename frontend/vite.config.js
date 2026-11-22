
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    clearMocks: true
  },

  server: {
    host: '0.0.0.0',

    proxy: {
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true
      },

      '/actuator': {
        target: 'http://localhost:8085',
        changeOrigin: true
      }
    }
  }
})
