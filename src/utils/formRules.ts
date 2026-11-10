// 必填项：提示文案在校验时按当前语言取值，不刷新页面切换语言后同样生效
export const required = {
  required: true,
  message: () => useI18n().t('common.required')
}
