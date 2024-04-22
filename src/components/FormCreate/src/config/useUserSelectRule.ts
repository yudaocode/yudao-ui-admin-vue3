import { generateUUID } from '@/utils'
import { localeProps, makeRequiredRule } from '@/components/FormCreate/src/utils'
import selectRule from '@/components/FormCreate/src/config/selectRule'

export const useUserSelectRule = () => {
  const label = '用户选择器'
  const name = 'UserSelect'
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
