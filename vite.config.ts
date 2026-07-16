import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'La Canchita de Carlos',
        short_name: 'La Canchita',
        description: 'Gestión interna de alquiler de canchas',
        theme_color: '#2563EB',
        background_color: '#FFFFFF',
        display: 'standalone',
      },
    }),
  ],
})