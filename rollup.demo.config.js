import buble from '@rollup/plugin-buble';
import typescriptPlugin from '@rollup/plugin-typescript';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';

export default {
  input: 'demo.ts',
  output: { format: 'iife', file: 'demo_bundle.js' },
  plugins: [
    typescriptPlugin({ module: 'ESNext' }),
    buble({
      exclude: 'node_modules/**',
      namedFunctionExpressions: false,
    }),

    nodeResolve({
      main: true,
      browser: true,
    }),

    commonJS({
      include: './**',
      sourceMap: false,
    }),
  ],
};
