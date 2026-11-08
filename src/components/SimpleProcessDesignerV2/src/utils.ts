import { TimeUnitType, ApproveType, APPROVE_TYPE, FieldPermissionType } from './consts'
import {
  collectFieldRules,
  isSubForm,
  parseSubFormFields,
  TABLE_FORM_TYPE
} from '@/components/FormCreate/src/utils'

// 获取条件节点默认的名称
export const getDefaultConditionNodeName = (
  index: number,
  defaultFlow: boolean | undefined
): string => {
  if (defaultFlow) {
    return '其它情况'
  }
  return '条件' + (index + 1)
}

// 获取包容分支条件节点默认的名称
export const getDefaultInclusiveConditionNodeName = (
  index: number,
  defaultFlow: boolean | undefined
): string => {
  if (defaultFlow) {
    return '其它情况'
  }
  return '包容条件' + (index + 1)
}

export const convertTimeUnit = (strTimeUnit: string) => {
  if (strTimeUnit === 'M') {
    return TimeUnitType.MINUTE
  }
  if (strTimeUnit === 'H') {
    return TimeUnitType.HOUR
  }
  if (strTimeUnit === 'D') {
    return TimeUnitType.DAY
  }
  return TimeUnitType.HOUR
}

export const getApproveTypeText = (approveType: ApproveType): string => {
  let approveTypeText = ''
  APPROVE_TYPE.forEach((item) => {
    if (item.value === approveType) {
      approveTypeText = item.label
      return
    }
  })
  return approveTypeText
}

/** 子表单子字段的权限标识：子表单字段.子字段，区分不同子表单中的同名字段 */
export const getSubFieldPermissionField = (subFormField: string, field: string) => {
  return `${subFormField}.${field}`
}

/** 是否为子表单子字段的权限标识 */
export const isSubFieldPermissionField = (field: string) => {
  return field.includes('.')
}

/**
 * 获得子表单子字段的实际权限：未单独设置时继承子表单，子表单的权限是上限
 *
 * @param subFormPermission 子表单的权限
 * @param permission 子字段的权限，未单独设置时为空
 */
export const getSubFieldPermission = (subFormPermission?: string, permission?: string) => {
  if (subFormPermission === FieldPermissionType.NONE) {
    return FieldPermissionType.NONE
  }
  if (subFormPermission === FieldPermissionType.READ && permission === FieldPermissionType.WRITE) {
    return FieldPermissionType.READ
  }
  return permission ?? subFormPermission
}

/** 表单规则中，是否包含子表单 */
export const hasSubForm = (rules: Array<Record<string, any>>): boolean => {
  return rules.some(
    (rule) => isSubForm(rule) || (Array.isArray(rule?.children) && hasSubForm(rule.children))
  )
}

/**
 * 将子表单的子字段权限写入表单规则。需要在 form-create 渲染前调用，新增的行沿用同一份规则
 *
 * 1. 只读：禁用，并去掉校验，避免阻断提交
 * 2. 隐藏：组件隐藏，但仍保留在每一行中，避免提交、删行时丢失或错位已有的值
 * 3. 子字段都隐藏时，隐藏整个子表单
 *
 * @param rules 表单规则
 * @param fieldsPermission 表单字段权限
 */
export const applySubFormsPermission = (
  rules: Array<Record<string, any>>,
  fieldsPermission?: Record<string, string>
) => {
  if (!fieldsPermission) {
    return
  }
  rules.forEach((rule) => {
    if (isSubForm(rule) && rule.field) {
      applySubFormPermission(rule, fieldsPermission)
    }
    if (Array.isArray(rule?.children)) {
      applySubFormsPermission(rule.children, fieldsPermission)
    }
  })
}

const applySubFormPermission = (
  rule: Record<string, any>,
  fieldsPermission: Record<string, string>
) => {
  const subFormPermission = fieldsPermission[rule.field]
  const subFields = parseSubFormFields(rule)
  // 子表单隐藏时，由表单字段权限隐藏整个子表单；没有子字段时（如表格表单未配置列），无需处理
  if (subFormPermission === FieldPermissionType.NONE || subFields.length === 0) {
    return
  }
  let hiddenCount = 0
  subFields.forEach(({ field, rule: item }) => {
    const permission = getSubFieldPermission(
      subFormPermission,
      fieldsPermission[getSubFieldPermissionField(rule.field, field)]
    )
    if (permission === FieldPermissionType.READ) {
      item.props = { ...item.props, disabled: true }
    } else if (permission === FieldPermissionType.NONE) {
      item.hidden = true
      hiddenCount++
    }
    if (permission === FieldPermissionType.READ || permission === FieldPermissionType.NONE) {
      item.$required = false
      item.validate = []
    }
  })
  if (hiddenCount > 0 && hiddenCount === subFields.length) {
    rule.hidden = true
    return
  }
  if (rule.type === TABLE_FORM_TYPE) {
    updateTableFormColumns(rule)
  }
}

/**
 * 表格表单：字段都隐藏的列移出表头，字段放到首列中隐藏保留；字段都不可编辑的列，去掉表头必填标记
 */
const updateTableFormColumns = (rule: Record<string, any>) => {
  const hiddenRules: Array<Record<string, any>> = []
  const columns = rule.props.columns.filter((column: Record<string, any>) => {
    const items = collectFieldRules(column.rule)
    if (items.length === 0) {
      return true
    }
    if (items.every((item) => item.hidden)) {
      hiddenRules.push(...items)
      return false
    }
    if (items.every((item) => item.hidden || item.props?.disabled)) {
      column.required = false
    }
    return true
  })
  if (hiddenRules.length > 0 && columns.length > 0) {
    columns[0].rule = [...(columns[0].rule ?? []), ...hiddenRules]
    rule.props.columns = columns
  }
}
