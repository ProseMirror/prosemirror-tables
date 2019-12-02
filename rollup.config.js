import buble from '@rollup/plugin-buble'

export default {
  input: './src/index.js',
  output: [{
    file: 'dist/index.js',
    format: 'cjs',
    sourcemap: true
  }, {
    file: 'dist/index.es.js',
    format: 'es',
    sourcemap: true
  }],
  plugins: [buble()],
  external(id) { return !/^[\.\/]/.test(id) }
}