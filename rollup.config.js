export default {
  input: './src/index.js',
  output: [
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  external(id) {
    return !/^[\.\/]/.test(id);
  },
};
