import { FormSchema } from '@/types/form'
import { ElRadio, ElRadioButton } from 'element-plus'
import { defineComponent } from 'vue'
import {
  getOptionDisabled,
  getOptionFields,
  getOptionKey,
  omitOptionFields
} from './useRenderSelect'

export const useRenderRadio = () => {
  const renderRadioOptions = (item: FormSchema) => {
    // 如果有别名，就取别名：optionsAlias 优先，其次 props（label / value / disabled，参考上游 6f1a94809）
    const { labelField, valueField, disabledField, keyField, omitFields } = getOptionFields(item)
    // RadioGroup 为兼容上游的组件名，与 Radio 一致渲染 ElRadio
    const isRadio = item.component === 'Radio' || item.component === 'RadioGroup'
    const Com = (isRadio ? ElRadio : ElRadioButton) as ReturnType<typeof defineComponent>
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
    renderRadioOptions
  }
}
