export default {
  input: './src/index.js',
  output: [{
    file: 'dist/index.js',
    format: 'cjs',
    generatedCode: 'es2015',
    sourcemap: true
  }, {
    file: 'dist/index.es.js',
    format: 'es',
    generatedCode: 'es2015',
    sourcemap: true
  }],
  external(id) { return !/^[\.\/]/.test(id) }
}
