const env = {
  es2021: true,
  node: true,
  'jest/globals': true,
};

const rules = {
  'consistent-return': 'off',
  'import/prefer-default-export': 'off',
  'import/first': 'off',
  'max-classes-per-file': ['error', 20],
  'no-underscore-dangle': [
    'error',
    {
      allowAfterThis: true,
    },
  ],
  'no-console': 'off',
  'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
  'import/extensions': [
    'error',
    {
      ts: 'never',
    },
  ],
  'linebreak-style': 0,
  'import/no-unresolved': 'error',
  'prettier/prettier': [
    'error',
    {
      tabWidth: 2,
      endOfLine: 'auto',
      singleQuote: true,
      trailingComma: 'all',
      arrowParens: 'avoid',
      printWidth: 80,
      bracketSpacing: true,
      jsxBracketSameLine: true,
    },
    {
      usePrettierrc: false,
    },
  ],
};

const parserOptions = {
  ecmaVersion: 12,
  sourceType: 'module',
};

module.exports = {
  env,
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  parser: '@typescript-eslint/parser',
  parserOptions,
  plugins: ['@typescript-eslint', 'prettier', 'import', 'jest'],
  rules: {
    ...rules,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
  },
  overrides: [
    {
      files: ['*.js'],
      env,
      extends: ['airbnb-base'],
      parserOptions,
      rules,
    },
  ],
};
