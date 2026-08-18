import path from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

import react from '@vitejs/plugin-react';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  assetsInclude: ['**/*.svg'],
  build: {
    outDir: 'public',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) return id.toString().split('node_modules/')[ 1 ].split('/')[ 0 ].toString();
        },
      },
    },
  },
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@routes': path.resolve(__dirname, 'src/routes'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@v4': path.resolve(__dirname, 'src/v4'),
      '@yappy/types': path.resolve(__dirname, 'src/types'),
    },
  },
});

/// <reference types="vite-plugin-svgr/client" />
