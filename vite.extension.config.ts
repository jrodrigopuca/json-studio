import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Vite config for building the Chrome extension.
 * Produces separate bundles for background, content, viewer, popup, and options.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@viewer': resolve(__dirname, 'src/viewer'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content/detector': resolve(__dirname, 'src/content/detector.ts'),
        'viewer/app': resolve(__dirname, 'src/viewer/app.ts'),
        'popup/popup': resolve(__dirname, 'src/popup/popup.html'),
        'options/options': resolve(__dirname, 'src/options/options.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    target: 'chrome120',
    minify: true,
    sourcemap: false,
  },
});
