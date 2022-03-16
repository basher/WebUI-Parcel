module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'prettier', // Enables eslint-config-prettier. Make sure this is always the last configuration in the extends array.
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['prettier'], // Uses eslint-plugin-prettier.
  rules: {
    'prettier/prettier': [
      'error',
      {
        'endOfLine': 'auto',
      }
    ],
    'import/prefer-default-export': 0,
    'import/extensions': 0,
    '@typescript-eslint/no-explicit-any': 0,
    'no-console': 2,
    'arrow-parens': 0,
    'no-unused-expressions': 0,
    'lines-between-class-members': [
      'error',
      'always',
      { 'exceptAfterSingleLine': true }
    ]
  },
};
