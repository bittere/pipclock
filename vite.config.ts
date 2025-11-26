import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), cloudflare(), react()],
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
