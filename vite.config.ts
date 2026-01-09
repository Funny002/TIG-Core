import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: './example/index.html',
  },
  build: {
    minify: true,
    outDir: 'libs',
    sourcemap: false,
    lib: {
      name: 'TigCore',
      fileName: 'index',
      entry: './src/main.ts',
      formats: ['es', 'umd'],
    },
  },
});
