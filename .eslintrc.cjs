module.exports = {
  root: true,
  extends: ["eslint:recommended", "prettier"],
  plugins: ["svelte3"],
  overrides: [
    {
      files: ["*.svelte"],
      processor: "svelte3/svelte3"
    }
  ],
  rules: {
    "no-useless-escape": "off"
  },
  settings: {
    "svelte3/ignore-styles": () => true
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2021
  },
  env: {
    browser: true,
    es6: true,
    node: true
  }
};
