import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages adresi: https://<kullanıcı>.github.io/pluton/
const base = process.env.PLUTON_BASE ?? '/pluton/';

export default defineConfig({
  base,
  define: {
    __BUILD__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Plüton',
        short_name: 'Plüton',
        description: 'LEGO koleksiyonun ve istek listen',
        lang: 'tr',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#BFE0FB',
        theme_color: '#10284A',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        globIgnores: ['**/*vietnamese*', 'data/**'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Katalog her gün değişir: çevrimiçiyken tazesini al, değilse önbellektekini kullan
            urlPattern: ({ url }) => url.pathname.endsWith('/data/catalog.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'katalog',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 2 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'lego.witcdn.net',
            handler: 'CacheFirst',
            options: {
              cacheName: 'lego-tr-gorselleri',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'cdn.rebrickable.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'set-gorselleri',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 120 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
