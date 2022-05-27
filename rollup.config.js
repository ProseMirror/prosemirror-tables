import buble from '@rollup/plugin-buble';
import typescriptPlugin from '@rollup/plugin-typescript';

export default {
  input: './src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.es.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [typescriptPlugin({ module: 'ESNext' }), buble()],
  external(id) {
    return !/^[\.\/]/.test(id); // eslint-disable-line
  },
};
