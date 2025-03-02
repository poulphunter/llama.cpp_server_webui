import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
/*
import { PluginOption } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import zlib from 'node:zlib';
*/

/* eslint-disable */
/*
const MAX_BUNDLE_SIZE = 1.5 * 1024 * 1024; // only increase when absolutely necessary

const GUIDE_FOR_FRONTEND = `
<!--
  This is a single file build of the frontend.
  It is automatically generated by the build process.
  Do not edit this file directly.
  To make changes, refer to the "Web UI" section in the README.
-->
`.trim();
*/
const FRONTEND_PLUGINS = [react()];

const BUILD_PLUGINS = [
  ...FRONTEND_PLUGINS,
  viteSingleFile(),
 /* (function llamaCppPlugin() {
    let config: any;
    return {
      name: 'llamacpp:build',
      apply: 'build',
      async configResolved(_config: any) {
        config = _config;
      },
      writeBundle() {
        const outputIndexHtml = path.join(config.build.outDir, 'index.html');
        const content =
          GUIDE_FOR_FRONTEND + '\n' + fs.readFileSync(outputIndexHtml, 'utf-8');
        const compressed = zlib.gzipSync(Buffer.from(content, 'utf-8'), {
          level: 9,
        });

        // because gzip header contains machine-specific info, we must remove these data from the header
        // timestamp
        compressed[0x4] = 0;
        compressed[0x5] = 0;
        compressed[0x6] = 0;
        compressed[0x7] = 0;
        // OS
        compressed[0x9] = 0;

        if (compressed.byteLength > MAX_BUNDLE_SIZE) {
          throw new Error(
            `Bundle size is too large (${Math.ceil(compressed.byteLength / 1024)} KB).\n` +
              `Please reduce the size of the frontend or increase MAX_BUNDLE_SIZE in vite.config.js.\n`
          );
        }

        const targetOutputFile = path.join(
          config.build.outDir,
          '../../public/index.html.gz'
        );
        fs.writeFileSync(targetOutputFile, compressed);
      },
    } satisfies PluginOption;
  })(),*/
];

export default defineConfig({
  // @ts-ignore
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
