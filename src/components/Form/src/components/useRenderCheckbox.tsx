import { FormSchema } from '@/types/form'
import { ElCheckbox, ElCheckboxButton } from 'element-plus'
import { defineComponent } from 'vue'

export const useRenderCheckbox = () => {
  const renderCheckboxOptions = (item: FormSchema) => {
    // 如果有别名，就取别名
    const labelAlias = item?.componentProps?.optionsAlias?.labelField
    const valueAlias = item?.componentProps?.optionsAlias?.valueField
    // CheckboxGroup 为兼容上游的组件名，与 Checkbox 一致渲染 ElCheckbox
    const isCheckbox = item.component === 'Checkbox' || item.component === 'CheckboxGroup'
    const Com = (isCheckbox ? ElCheckbox : ElCheckboxButton) as ReturnType<typeof defineComponent>
    return item?.componentProps?.options?.map((option) => {
      const { ...other } = option
      // 提供 value（或 valueField 别名）的选项显式传值（放在 other 之后，别名值优先）；
      // 缺少 value 的旧配置仍保留 Element Plus 现有的 label 回退行为
      return (
        <Com {...other} value={option[valueAlias || 'value']}>
          {option[labelAlias || 'label']}
        </Com>
      )
    })
  }

  return {
    renderCheckboxOptions
  }
}
