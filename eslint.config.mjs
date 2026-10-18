import { globalIgnores } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default [
  ...nextCoreWebVitals,
  ...nextTypescript,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'out/**',
    'build/**',
    'supabase/functions/**',
    'next-env.d.ts',
    'eslint.config.mjs',
    '*.config.js',
    '*.config.mjs',
    '*.config.ts',
  ]),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react/no-array-index-key': 'warn',
      'react/no-unescaped-entities': 'off',
      'react/self-closing-comp': 'warn',
      '@next/next/no-page-custom-font': 'off',
      '@next/next/no-img-element': 'warn',
      'jsx-a11y/alt-text': 'warn',
      'prefer-const': 'warn',
    },
  },
]
