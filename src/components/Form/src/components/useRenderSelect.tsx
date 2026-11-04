import { FormSchema } from '@/types/form'
import { ComponentOptions } from '@/types/components'
import { ElOption, ElOptionGroup } from 'element-plus'
import { getSlot } from '@/utils/tsxHelper'
import { isFunction } from '@/utils/is'
import { Slots } from 'vue'

export const useRenderSelect = (slots: Slots) => {
  // 渲染 select options
  const renderSelectOptions = (item: FormSchema) => {
    // 如果有别名，就取别名
    const labelAlias = item?.componentProps?.optionsAlias?.labelField
    // 分组渲染函数（参考上游 998d9f3ee）：参数为分组项，返回值替换整个 ElOptionGroup
    const optionGroupDefault = item?.componentProps?.slots?.optionGroupDefault
    return item?.componentProps?.options?.map((option) => {
      if (option?.options?.length) {
        if (isFunction(optionGroupDefault)) {
          return optionGroupDefault(option)
        }
        return (
          <ElOptionGroup label={option[labelAlias || 'label']}>
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
    const labelAlias = item?.componentProps?.optionsAlias?.labelField
    const valueAlias = item?.componentProps?.optionsAlias?.valueField
    // 选项内容渲染函数（参考上游 998d9f3ee）：参数为选项
    const optionDefault = item?.componentProps?.slots?.optionDefault

    const { label, value, ...other } = option

    return (
      <ElOption
        {...other}
        label={labelAlias ? option[labelAlias] : label}
        value={valueAlias ? option[valueAlias] : value}
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
