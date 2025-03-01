import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
    outDir: 'dist', // Asegura que el build se genere en dist/
    manifest: true, // Genera el manifest.json para encontrar los archivos con hash
    rollupOptions: {
      input: './index.html', // Asegura que Vite procese bien el index.html
      output: {
        entryFileNames: 'assets/index.js', // 🔹 Fuerza a que siempre se llame index.js
      }
    }
  },

  base: './' // 🔹 Asegura que los archivos se sirvan correctamente
})
