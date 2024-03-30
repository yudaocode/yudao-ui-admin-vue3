// TODO puhui999: 借鉴一下 form-create-designer utils 方法 🤣 (导入不了只能先 copy 过来用下)
export function makeRequiredRule() {
  return {
    type: 'Required',
    field: 'formCreate$required',
    title: '是否必填'
  }
}

export const localeProps = (t, prefix, rules) => {
  return rules.map((rule) => {
    if (rule.field === 'formCreate$required') {
      rule.title = t('props.required') || rule.title
    } else if (rule.field && rule.field !== '_optionType') {
      rule.title = t('components.' + prefix + '.' + rule.field) || rule.title
    }
    return rule
  })
}
