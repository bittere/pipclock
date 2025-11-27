import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [tailwindcss(), cloudflare(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: 'public',
  server: {
    hmr: {
      host: 'localhost',
      port: 8787,
    },
    middlewareMode: false,
  },
  build: {
    rollupOptions: {
      input: './index.html',
    },
  },
});
