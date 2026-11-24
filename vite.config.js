import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `--mode blocks` is the hosted build on Blocks (see .env.blocks): it lives at the domain root, so
// /login/callback can load the app's assets, and it may call the Blocks API. Every other build keeps
// relative paths for the desktop app and talks to nothing.
const BLOCKS_API = 'https://blocksapi.slsblx.com';

// Strict CSP for the packaged app only; the dev server needs inline scripts for HMR.
const csp = (mode) => ({
  name: 'ibms-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: `default-src 'self'; connect-src 'self'${mode === 'blocks' ? ` ${BLOCKS_API}` : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:`,
      },
      injectTo: 'head-prepend',
    },
  ],
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), csp(mode)],
  base: mode === 'blocks' ? '/' : './',
  server: { port: 5173, strictPort: true },
  build: { chunkSizeWarningLimit: 2000 },
}));
