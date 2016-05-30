module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  extends: 'eslint:recommended',
  env: {
    'browser': true
  },
  rules: {
    "curly": 2,
    "eqeqeq": 2,
    "no-eval": 2,
    "linebreak-style": 2,
    "new-cap": 2,
    "no-caller": 2,
    "no-new": 2,
    "no-unused-vars": [2, { "argsIgnorePattern": "^_" }],
    "dot-notation": 2,
    "no-eq-null": 2
  },
  globals: {
    Ember: true,
  }
};
