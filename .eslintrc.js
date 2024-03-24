module.exports = {
  root: true,
  env: { node: true, jest: true },
  ignorePatterns: ['.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: { project: 'tsconfig.json', sourceType: 'module', ecmaVersion: 'latest' },
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  plugins: ['@typescript-eslint/eslint-plugin', 'simple-import-sort'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'prettier/prettier': ['error', { printWidth: 120 }],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    "@typescript-eslint/no-namespace": "off"
  },
};
