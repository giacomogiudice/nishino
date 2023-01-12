module.exports = {
  root: true,
  extends: ['eslint:recommended', 'prettier', 'plugin:svelte/recommended'],
  rules: {
    'no-useless-escape': 'off',
    'svelte/valid-compile': 'warn'
  },
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true,
    es2022: true
  }
};
