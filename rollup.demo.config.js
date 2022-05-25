import buble from '@rollup/plugin-buble';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';

export default {
  input: 'demo.js',
  output: { format: 'iife', file: 'demo_bundle.js' },
  plugins: [
    buble({
      exclude: 'node_modules/**',
      namedFunctionExpressions: false,
    }),

    nodeResolve({
      main: true,
      browser: true,
    }),

    commonJS({
      include: '../**',
      sourceMap: false,
    }),
  ],
};
