import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // Dos páginas: la landing (/) y El Ropero a pantalla completa (/ropero/)
      input: {
        main: resolve(__dirname, 'index.html'),
        ropero: resolve(__dirname, 'ropero/index.html'),
      },
    },
  },
})
