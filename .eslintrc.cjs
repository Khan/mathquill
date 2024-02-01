/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-prototype-builtins': 'off',
    'no-var': 'off',
    'no-restricted-imports': [
      'error',
      {
        patterns: ['*/*', '!**/bundle'],
      },
    ],
  },
  root: true,
};
