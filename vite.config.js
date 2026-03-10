import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'disable-ssr',
      apply: 'build',
      config: () => ({
        build: {
          lib: false,
          ssr: false,
          rollupOptions: {
            output: {
              entryFileNames: 'assets/[name].js',
              chunkFileNames: 'assets/[name].js',
              assetFileNames: 'assets/[name].[ext]'
            }
          }
        },
        ssr: {
          noExternal: ['*']
        }
      })
    }
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    ssr: false,
    target: 'esnext',
    minify: 'esbuild'
  }
})
