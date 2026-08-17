import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.output/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // WXT entrypoints export their content-script definition beside the root component.
      'react-refresh/only-export-components': 'off',
      // Network lifecycle effects intentionally reset stale UI before issuing a new request.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
);
