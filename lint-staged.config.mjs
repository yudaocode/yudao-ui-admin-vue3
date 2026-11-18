export default {
  'src/**/*.{js,ts,tsx,vue}': [
    'eslint --fix --cache --cache-location node_modules/.cache/eslint/',
    'prettier --write --log-level warn --cache --cache-location node_modules/.cache/prettier/.prettier-cache'
  ],
  'src/**/*.{css,less,scss,postcss,vue}': [
    'stylelint --fix --cache --cache-location node_modules/.cache/stylelint/'
  ],
  'src/**/*.{json,html,md}': [
    'prettier --write --log-level warn --cache --cache-location node_modules/.cache/prettier/.prettier-cache'
  ],
  // 根目录配置、build/、types/ 只做格式化，与 lint:format 范围一致（不扩大 ESLint、Stylelint 范围）。
  // 不含 / 的模式按文件名匹配任意层级，这里只列出根目录现有的配置文件名，避免匹配到 src 下的文件而与上方规则重复执行
  '{eslint,lint-staged,prettier,stylelint,uno,vite}.config.{js,mjs,ts}': [
    'prettier --write --log-level warn --cache --cache-location node_modules/.cache/prettier/.prettier-cache'
  ],
  '{build/**/*.{js,ts},types/**/*.ts}': [
    'prettier --write --log-level warn --cache --cache-location node_modules/.cache/prettier/.prettier-cache'
  ]
}
