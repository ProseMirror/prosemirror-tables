module.exports = {
  extends: ['eslint:recommended'],
  plugins: ['jest'],
  env: {
    browser: true,
    'jest/globals': true,
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2017,
  },
};
