import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certPath = path.resolve(__dirname, '../certs/ww2.ncra.tifr.res.in.crt');
const keyPath = path.resolve(__dirname, '../certs/ww2.ncra.tifr.res.in.key');

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    https: {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    },
    hmr: {
      host: 'ww2.ncra.tifr.res.in',
      protocol: 'wss',
      port: 5174,
    },
  },
});