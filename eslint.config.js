import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import n from 'eslint-plugin-n';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['build/**', 'node_modules/**'] },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    commaDangle: 'never',
    braceStyle: '1tbs',
    arrowParens: true
  }),
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js', 'tools/*.mjs'] },
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@stylistic/max-len': ['error', { code: 120 }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error'
    }
  },
  {
    files: ['src/**/*.ts'],
    extends: [unicorn.configs.recommended, sonarjs.configs.recommended, n.configs['flat/recommended-module']],
    rules: {
      'n/no-missing-import': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/consistent-class-member-order': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/name-replacements': 'off'
    }
  },
  {
    files: ['src/main/Main.ts'],
    rules: {
      'n/no-process-exit': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/no-top-level-assignment-in-function': 'off'
    }
  },
  {
    files: ['src/test/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off'
    }
  }
);
