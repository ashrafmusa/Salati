import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // FIX FOR THE ASSETS ERROR:
      // This tells the plugin to generate the necessary icons and images
      // from a single source file (e.g., your logo).
      pwaAssets: {
        disabled: false,
        // The `preset` option automatically handles all required icon sizes
        // from a single source image.
        preset: 'minimal',
        images: ['/logo.svg'] // Path to your source image file
      },

      manifest: {
        name: 'Salati App',
        short_name: 'Salati',
        description: 'An integrated e-commerce platform for Salati',
        // It's a good practice to keep the theme color consistent with the HTML file
        theme_color: '#a9ae8b',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/admin/],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: [
        'apple-touch-icon.png',
        'favicon.ico',
        'favicon-96x96.png',
        'favicon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        admin: './admin.html',
      },
    },
  },
})