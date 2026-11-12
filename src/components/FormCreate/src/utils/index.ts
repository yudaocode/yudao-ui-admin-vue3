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
    const item: Record<string, any> = {
      field,
      title,
      type,
      required
    }
    // DONE 子表单 需要处理子表单字段
    // 子表单（表格表单、子表单）：解析其子字段，用于配置子字段权限
    if (isSubForm(rule)) {
      item.children = parseSubFormFields(rule)
    }
    fields.push(item)
  }
  if (children && Array.isArray(children)) {
    children.forEach((rule) => {
      parseFormFields(rule, fields)
    })
  }
}

/** 表格表单（tableForm）的类型 */
export const TABLE_FORM_TYPE = 'tableForm'
/** 子表单（group）的类型 */
export const GROUP_FORM_TYPE = 'group'

/** 是否为子表单：表格表单、子表单，值都是对象数组 */
export const isSubForm = (rule?: Record<string, any>) => {
  return rule?.type === TABLE_FORM_TYPE || rule?.type === GROUP_FORM_TYPE
}

/**
 * 解析子表单的子字段：表格表单在 props.columns[].rule，子表单在 props.rule
 *
 * @param rule 子表单的生成规则
 * @return 子字段；表格表单的 title 优先使用列名
 */
export const parseSubFormFields = (rule: Record<string, any>) => {
  const fields: Array<{ field: string; title: string; rule: Record<string, any> }> = []
  if (rule.type === TABLE_FORM_TYPE) {
    rule.props?.columns?.forEach((column: Record<string, any>) => {
      collectFieldRules(column.rule).forEach((item) => {
        fields.push({
          field: item.field,
          title: column.label || item.title || item.field,
          rule: item
        })
      })
    })
  } else if (rule.type === GROUP_FORM_TYPE) {
    collectFieldRules(rule.props?.rule).forEach((item) => {
      fields.push({ field: item.field, title: item.title || item.field, rule: item })
    })
  }
  return fields
}

/** 收集组件规则中的字段：递归布局组件，不进入字段组件内部 */
export const collectFieldRules = (
  rules?: Array<Record<string, any>>,
  fieldRules: Array<Record<string, any>> = []
) => {
  rules?.forEach((rule) => {
    if (!rule || typeof rule !== 'object') {
      return
    }
    if (rule.field) {
      fieldRules.push(rule)
    } else {
      collectFieldRules(rule.children, fieldRules)
    }
  })
  return fieldRules
}
