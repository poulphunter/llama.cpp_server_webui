import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const FRONTEND_PLUGINS = [react()];

const BUILD_PLUGINS = [...FRONTEND_PLUGINS, viteSingleFile()];

export default defineConfig({
  plugins: process.env.ANALYZE ? FRONTEND_PLUGINS : BUILD_PLUGINS,
  server: {
    proxy: {
      '/v1': 'http://localhost:8080',
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});
