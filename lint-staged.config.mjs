export default {
  'src/**/*.{js,ts,tsx,vue}': [
    'eslint --fix --cache --cache-location node_modules/.cache/eslint/',
    'prettier --write --loglevel warn --cache --cache-location node_modules/.cache/prettier/.prettier-cache'
  ],
  'src/**/*.{css,less,scss,postcss,vue}': [
    'stylelint --fix --cache --cache-location node_modules/.cache/stylelint/'
  ],
  'src/**/*.{json,html,md}': [
    'prettier --write --loglevel warn --cache --cache-location node_modules/.cache/prettier/.prettier-cache'
  ]
}
