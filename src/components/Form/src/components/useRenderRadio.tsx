import { FormSchema } from '@/types/form'
import { ElRadio, ElRadioButton } from 'element-plus'
import { defineComponent } from 'vue'

export const useRenderRadio = () => {
  const renderRadioOptions = (item: FormSchema) => {
    // 如果有别名，就取别名
    const labelAlias = item?.componentProps?.optionsAlias?.labelField
    const valueAlias = item?.componentProps?.optionsAlias?.valueField
    // RadioGroup 为兼容上游的组件名，与 Radio 一致渲染 ElRadio
    const isRadio = item.component === 'Radio' || item.component === 'RadioGroup'
    const Com = (isRadio ? ElRadio : ElRadioButton) as ReturnType<typeof defineComponent>
    return item?.componentProps?.options?.map((option) => {
      const { ...other } = option
      // 显式传 value（放在 other 之后，别名值优先），不再依赖 label 作为值的废弃回退
      return (
        <Com {...other} value={option[valueAlias || 'value']}>
          {option[labelAlias || 'label']}
        </Com>
      )
    })
  }

  return {
    renderRadioOptions
  }
}
