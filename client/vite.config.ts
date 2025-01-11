import path from 'path';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import mkcert from 'vite-plugin-mkcert';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), wasm(), mkcert()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
