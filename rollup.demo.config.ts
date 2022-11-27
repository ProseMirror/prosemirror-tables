import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'demo.js',
  output: { format: 'iife', file: 'demo_bundle.js' },
  plugins: [
    typescript({
      sourceMap: false,
      declaration: false,
      declarationMap: false,
      declarationDir: null,
    }),
    nodeResolve({
      browser: true,
    }),
  ],
};
