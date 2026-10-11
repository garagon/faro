import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { officialMiddleware } from './server/official.mjs';

export default defineConfig({
  build: { outDir: 'dist/client' },
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  plugins: [
    react(),
    {
      name: 'faro-official-sources',
      configureServer(server) {
        server.middlewares.use(officialMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(officialMiddleware);
      },
    },
  ],
});
