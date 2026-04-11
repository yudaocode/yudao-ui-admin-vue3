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

/**
 * 解析表单组件的  field, title 等字段（递归，如果组件包含子组件）
 * 
 * @param rule  组件的生成规则 https://www.form-create.com/v3/guide/rule
 * @param fields 解析后表单组件字段
 * @param parentTitle  如果是子表单，子表单的标题，默认为空
 */
export const parseFormFields = (
  rule: Record<string, any>,
  fields: Array<Record<string, any>> = [],
  parentTitle: string = ''
) => {
  const { type, field, $required, title: tempTitle, children } = rule
  if (field && tempTitle) {
    let title = tempTitle
    if (parentTitle) {
      title = `${parentTitle}.${tempTitle}`
    }
    let required = false
    if ($required) {
      required = true
    }
    fields.push({
      field,
      title,
      type,
      required
    })
    // TODO 子表单 需要处理子表单字段
    // if (type === 'group' && rule.props?.rule && Array.isArray(rule.props.rule)) {
    //   // 解析子表单的字段
    //   rule.props.rule.forEach((item) => {
    //     parseFields(item, fieldsPermission, title)
    //   })
    // }
  }
  if (children && Array.isArray(children)) {
    children.forEach((rule) => {
      parseFormFields(rule, fields)
    })
  }
}
