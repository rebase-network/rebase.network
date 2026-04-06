import path from 'node:path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@rebase/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
