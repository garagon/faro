import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { officialMiddleware } from './server/official.mjs';
import { precacheList } from './src/lib/offline.ts';

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Writes the hashed build file list into sw.js, so each release stores a matching set.
function offlineShell(): Plugin {
  return {
    name: 'faro-offline-shell',
    apply: 'build',
    generateBundle(_, bundle) {
      const worker = bundle['sw.js'];
      if (!worker || worker.type !== 'chunk') throw new Error('sw.js was not built');
      if (/^\s*import[\s{*"']|\bimport\(/m.test(worker.code))
        throw new Error('sw.js must be a single classic script without imports');
      const files = precacheList(Object.keys(bundle));
      // The version covers file contents, not only names: a changed about page, manifest, icon
      // or illustration (same name) must still reach installed copies.
      const hash = createHash('sha256').update(JSON.stringify(files));
      for (const path of files) {
        const name = path === '/' ? 'index.html' : path.replace(/^\//, '');
        const item = bundle[name];
        if (item) hash.update(item.type === 'asset' ? item.source : item.code);
        else if (existsSync(entry(`./public/${name}`)))
          hash.update(readFileSync(entry(`./public/${name}`)));
        else if (name === 'index.html') hash.update(readFileSync(entry('./index.html')));
      }
      const version = hash.digest('hex').slice(0, 16);
      const placeholder = /\[\s*["'`]__FARO_PRECACHE__["'`]\s*\]/;
      if (!placeholder.test(worker.code)) throw new Error('sw.js precache placeholder missing');
      worker.code = worker.code
        .replace(placeholder, JSON.stringify(files))
        .replaceAll('__FARO_VERSION__', version);
    },
  };
}

// Link previews need absolute addresses. Set FARO_SITE_URL to the production origin at build
// time (for example FARO_SITE_URL=https://faro.example npm run build); without it the relative
// paths stay, which work for the site itself but not for previews in other apps.
function siteUrl(): Plugin {
  const origin = (process.env.FARO_SITE_URL ?? '').replace(/\/+$/, '');
  return {
    name: 'faro-site-url',
    transformIndexHtml(html) {
      if (!/^https:\/\/[^/\s"]+$/.test(origin)) return html;
      return html
        .replaceAll('content="/og-image.png"', `content="${origin}/og-image.png"`)
        .replace(
          '<meta property="og:type" content="website" />',
          `<meta property="og:type" content="website" />\n    <meta property="og:url" content="${origin}/" />\n    <link rel="canonical" href="${origin}/" />`,
        );
    },
  };
}

// Distributed builds carry their notices: Faro's licence, third-party notices, the country
// database licence and the dependency licence texts, served under /licenses/. Not precached.
function notices(): Plugin {
  const files: Record<string, string> = {
    'licenses/LICENSE.txt': './LICENSE',
    'licenses/THIRD_PARTY_NOTICES.txt': './THIRD_PARTY_NOTICES.md',
    'licenses/ODbL-1.0.txt': './licenses/ODbL-1.0.txt',
    'licenses/dependencies.txt': './licenses/dependencies.txt',
  };
  return {
    name: 'faro-notices',
    apply: 'build',
    generateBundle() {
      for (const [fileName, path] of Object.entries(files))
        this.emitFile({ type: 'asset', fileName, source: readFileSync(entry(path)) });
    },
  };
}

export default defineConfig({
  // shadcn/ui components import from "@/…" (src/).
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    outDir: 'dist/client',
    rollupOptions: {
      input: { main: entry('./index.html'), sw: entry('./src/sw.ts') },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
  // Local deployment copies, videos and reports live in artifacts/ and must not reload the app.
  server: { host: '127.0.0.1', watch: { ignored: ['**/artifacts/**'] } },
  preview: { host: '127.0.0.1' },
  plugins: [
    react(),
    tailwindcss(),
    offlineShell(),
    siteUrl(),
    notices(),
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
