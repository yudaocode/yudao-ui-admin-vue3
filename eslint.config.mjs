import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import unocss from '@unocss/eslint-config/flat'
import autoImportGlobals from './.eslintrc-auto-import.json' with { type: 'json' }

export default tseslint.config(
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      'build/',
      'config/',
      'dist/',
      'dist*/',
      '*.js',
      '*.mjs',
      '!eslint.config.mjs',
      'test/unit/coverage/',
      'node_modules/',
      'src/main.ts',
      'e2e/',
      'src/types/auto-components.d.ts'
    ]
  },

  // Base TypeScript config
  ...tseslint.configs.recommended,

  // Vue recommended config
  ...pluginVue.configs['flat/recommended'],

  // UnoCSS config
  unocss,

  // Vue files use vue-eslint-parser with TypeScript parser
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },

  // Main rules config
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...autoImportGlobals.globals
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      // Vue rules
      'vue/no-reserved-component-names': 'off',
      'vue/custom-event-name-casing': 'off',
      'vue/attributes-order': 'off',
      'vue/one-component-per-file': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'off',
      'vue/require-toggle-inside-transition': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'always',
            normal: 'never',
            component: 'always'
          },
          svg: 'always',
          math: 'always'
        }
      ],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',

      // TypeScript rules
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'vue/no-ref-as-operand': 'off',
      'vue/no-mutating-props': 'off',
      'vue/no-side-effects-in-computed-properties': 'off',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'no-unused-vars': 'off',
      'space-before-function-paren': 'off',

      // UnoCSS rules - 芋艿：禁用 unocss 顺序提示
      '@unocss/order': 'off',
      '@unocss/order-attributify': 'off',
      'unocss/order': 'off',
      'unocss/order-attributify': 'off'
    }
  }
)
