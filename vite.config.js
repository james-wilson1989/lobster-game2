import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    ssr: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  ssr: {
    noExternal: ['@wagmi/core', 'viem', 'framer-motion', 'wagmi']
  }
})
