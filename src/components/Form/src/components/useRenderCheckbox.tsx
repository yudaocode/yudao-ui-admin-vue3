import { FormSchema } from '@/types/form'
import { ElCheckbox, ElCheckboxButton } from 'element-plus'
import { defineComponent } from 'vue'
import {
  getOptionDisabled,
  getOptionFields,
  getOptionKey,
  omitOptionFields
} from './useRenderSelect'

export const useRenderCheckbox = () => {
  const renderCheckboxOptions = (item: FormSchema) => {
    // 如果有别名，就取别名：optionsAlias 优先，其次 props（label / value / disabled，参考上游 e34b5cb613）
    const { labelField, valueField, disabledField, keyField, omitFields } = getOptionFields(item)
    // CheckboxGroup 为兼容上游的组件名，与 Checkbox 一致渲染 ElCheckbox
    const isCheckbox = item.component === 'Checkbox' || item.component === 'CheckboxGroup'
    const Com = (isCheckbox ? ElCheckbox : ElCheckboxButton) as ReturnType<typeof defineComponent>
    return item?.componentProps?.options?.map((option) => {
      const other = omitOptionFields(option, omitFields)
      const value = option[valueField]
      // 提供 value（或别名字段）的选项显式传值（放在 other 之后，别名值优先）；
      // 缺少 value 的旧配置仍保留 Element Plus 现有的 label 回退行为
      return (
        <Com
          {...other}
          {...getOptionDisabled(option, disabledField)}
          key={getOptionKey(option, keyField, value)}
          value={value}
        >
          {option[labelField]}
        </Com>
      )
    })
  }

  return {
    renderCheckboxOptions
  }
}
