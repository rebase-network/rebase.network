import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astroPlugin from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astroPlugin.configs.recommended,
  {
    files: ['**/*.astro'],
    rules: {
      'astro/no-set-html-directive': 'off'
    }
  },
  {
    files: ['**/*.{js,mjs,ts,astro}'],
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    }
  },
  {
    ignores: ['dist', '.astro'],
  }
];
