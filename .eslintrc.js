//module.exports = {
//  extends: ['eslint:recommended'],
//  plugins: ['jest'],
//  env: {
//    browser: true,
//    'jest/globals': true,
//  },
//  parserOptions: {
//    sourceType: 'module',
//    ecmaVersion: 2017,
//  },
//};

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
};
