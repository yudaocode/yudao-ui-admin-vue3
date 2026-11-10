import { FormSchema } from '@/types/form'
import { ComponentOptions } from '@/types/components'
import { ElOption, ElOptionGroup } from 'element-plus'
import { getSlot } from '@/utils/tsxHelper'
import { isFunction, isObject, isString } from '@/utils/is'
import { Slots } from 'vue'

const defaultOptionFields = ['label', 'value', 'disabled', 'key']

/**
 * 选项字段别名（Select / Radio / Checkbox 类共用），逐字段解析：
 * label / value 优先已有 optionsAlias（labelField / valueField，保持原行为），未配置时兼容上游
 * componentProps.props（Select 参考上游 4d04734e13 的 keyAlias 及 83513d519 改为 props.label / value / key，
 * Radio 参考 6f1a94809 的 props.label / value / disabled，Checkbox 参考 e34b5cb613 的 props 协议），最后为默认字段；
 * disabled / key 只来自 props（Select 的 props.disabled、Radio / Checkbox 的 props.key 为本地兼容扩展），
 * 未配置时选项自身的 disabled / key 照常透传。
 * omitFields 为 props 映射的非默认字段，不再透传给选项组件（如 name、id 会落到组件同名属性或 DOM 上）
 */
export const getOptionFields = (item: FormSchema) => {
  const { optionsAlias, props } = (item?.componentProps || {}) as Recordable
  const getPropsField = (name: string): string | undefined => {
    const field = isObject(props) ? props[name] : undefined
    return isString(field) && field ? field : undefined
  }
  const labelProps = optionsAlias?.labelField ? undefined : getPropsField('label')
  const valueProps = optionsAlias?.valueField ? undefined : getPropsField('value')
  const disabledField = getPropsField('disabled')
  const keyField = getPropsField('key')
  return {
    labelField: (optionsAlias?.labelField || labelProps || 'label') as string,
    valueField: (optionsAlias?.valueField || valueProps || 'value') as string,
    disabledField,
    keyField,
    omitFields: [labelProps, valueProps, disabledField, keyField].filter(
      (field): field is string => !!field && !defaultOptionFields.includes(field)
    )
  }
}

/** 选项 VNode key：优先 key 字段（或 props.key 别名），缺少时以非对象的 value 回退；都缺少时不设置 key */
export const getOptionKey = (option: Recordable, keyField: string | undefined, value: unknown) => {
  const key = option[keyField || 'key']
  if (key !== undefined && key !== null) return key
  return typeof value === 'object' || typeof value === 'function' ? undefined : value
}

/** 透传给选项组件的其余字段：浅拷贝选项自身字段，去掉已显式传入或已映射的字段 */
export const omitOptionFields = (option: Recordable, fields: string[]) => {
  const other = { ...option }
  fields.forEach((field) => delete other[field])
  return other
}

/** props.disabled 映射后的禁用属性：映射字段缺失时保留选项原 disabled；未映射时不额外设置 */
export const getOptionDisabled = (option: Recordable, disabledField: string | undefined) => {
  return disabledField ? { disabled: option[disabledField] ?? option.disabled } : {}
}

export const useRenderSelect = (slots: Slots) => {
  // 渲染 select options
  const renderSelectOptions = (item: FormSchema) => {
    // 如果有别名，就取别名
    const { labelField, valueField, keyField } = getOptionFields(item)
    // 分组渲染函数（参考上游 998d9f3ee）：参数为分组项，返回值替换整个 ElOptionGroup
    const optionGroupDefault = item?.componentProps?.slots?.optionGroupDefault
    return item?.componentProps?.options?.map((option) => {
      if (option?.options?.length) {
        if (isFunction(optionGroupDefault)) {
          return optionGroupDefault(option)
        }
        return (
          <ElOptionGroup
            key={getOptionKey(option, keyField, option[valueField])}
            label={option[labelField]}
          >
            {() => {
              return option?.options?.map((v) => {
                return renderSelectOptionItem(item, v)
              })
            }}
          </ElOptionGroup>
        )
      } else {
        return renderSelectOptionItem(item, option)
      }
    })
  }

  // 渲染 select option item
  const renderSelectOptionItem = (item: FormSchema, option: ComponentOptions) => {
    // 如果有别名，就取别名
    const { labelField, valueField, disabledField, keyField, omitFields } = getOptionFields(item)
    // 选项内容渲染函数（参考上游 998d9f3ee）：参数为选项
    const optionDefault = item?.componentProps?.slots?.optionDefault

    const other = omitOptionFields(option, ['label', 'value', ...omitFields])
    const value = option[valueField]

    return (
      <ElOption
        {...other}
        {...getOptionDisabled(option, disabledField)}
        key={getOptionKey(option, keyField, value)}
        label={option[labelField]}
        value={value}
      >
        {{
          // 优先级：optionsSlot 模板插槽 {field}-option > slots.optionDefault 渲染函数 > 默认显示 label
          default: () => {
            if (item?.componentProps?.optionsSlot) {
              return getSlot(slots, `${item.field}-option`, { item: option })
            }
            return isFunction(optionDefault) ? optionDefault(option) : undefined
          }
        }}
      </ElOption>
    )
  }

  return {
    renderSelectOptions
  }
}
