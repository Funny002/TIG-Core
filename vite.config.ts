import { defineConfig } from 'vite';

// vite.config 运行于 Node，但本项目的 tsconfig 未引入 @types/node，这里做局部声明
declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  server: {
    open: process.env.VITE_NO_OPEN ? false : './example/index.html',
  },
  build: {
    minify: true,
    outDir: 'libs',
    sourcemap: false,
    lib: {
      name: 'TigCore',
      fileName: 'index',
      entry: './src/index.ts',
      formats: ['es', 'umd'],
    },
  },
});
