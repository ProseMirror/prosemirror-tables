import { defineConfig } from 'tsdown';

export default defineConfig({
  target: 'es2018',
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  fixedExtension: false,
  clean: true,
});
