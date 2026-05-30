import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiOrigin = env.VITE_API_ORIGIN ?? 'http://localhost:3001';

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'itin',
          short_name: 'itin',
          description: 'Group trip itineraries',
          theme_color: '#0f1115',
          background_color: '#0f1115',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192 512x512 any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: '/icon.svg',
              sizes: '192x192 512x512 any',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg}'],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: apiOrigin, changeOrigin: true },
        '/images': { target: apiOrigin, changeOrigin: true },
      },
    },
    // The production `vite preview` server (used on Railway) rejects unknown
    // Host headers unless they're allowlisted. Railway's domain is dynamic.
    preview: {
      host: true,
      allowedHosts: true,
    },
  };
});
