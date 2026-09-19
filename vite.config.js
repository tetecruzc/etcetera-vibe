import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/etcetera-vibe/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/logo.png'],
      manifest: {
        name: 'Etcetera Vibe',
        short_name: 'Etcetera',
        description: 'Gestión de Inventario y Ventas',
        theme_color: '#FAF7F2',
        background_color: '#FAF7F2',
        display: 'standalone',
        icons: [
          {
            src: 'assets/logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'assets/logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
});
