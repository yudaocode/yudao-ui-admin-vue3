import { generateUUID } from '@/utils'
import { localeProps, makeRequiredRule } from '@/components/FormCreate/src/utils'
import selectRule from '@/components/FormCreate/src/config/selectRule'
import { DragRule } from '@/components/FormCreate/src/type'

export const useDeptSelectRule = (): DragRule => {
  const label = '部门选择器'
  const name = 'DeptSelect'
  return {
    icon: 'icon-select',
    label,
    name,
    rule() {
      return {
        type: name,
        field: generateUUID(),
        title: label,
        info: '',
        $required: false
      }
    },
    props(_, { t }) {
      return localeProps(t, name + '.props', [makeRequiredRule(), ...selectRule])
    }
  }
}
