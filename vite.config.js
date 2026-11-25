import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Strict CSP for the packaged app only; the dev server needs inline scripts for HMR.
// The app talks to no server: the demo record lives in the browser.
const csp = {
  name: 'ibms-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: "default-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:",
      },
      injectTo: 'head-prepend',
    },
  ],
};

// Relative paths, so the same build runs on GitHub Pages (under /IBMS-Redesign/) and in the desktop app.
export default defineConfig({
  plugins: [react(), csp],
  base: './',
  server: { port: 5173, strictPort: true },
  build: { chunkSizeWarningLimit: 2000 },
});
