import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        secure: false,
        changeOrigin: true
      }
    }
  },

  build: {
    outDir: 'dist', // Asegura que Vite guarde el build en 'dist/'
    manifest: true, // Genera un manifest.json para encontrar archivos en producción
  },

  base: './' // Asegura que los archivos estáticos se sirvan correctamente en producción
})
