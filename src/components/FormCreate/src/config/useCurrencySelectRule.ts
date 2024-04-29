import { generateUUID } from '@/utils'
import { localeProps, makeRequiredRule } from '@/components/FormCreate/src/utils'
import selectRule from '@/components/FormCreate/src/config/selectRule'

export const useCurrencySelectRule = () => {
  const label = '通用选择器'
  const name = 'CurrencySelect'
  return {
    icon: 'icon-select',
    label,
    name,
    rule() {
      return {
        type: name,
        field: generateUUID(),
        title: label,
        info: '下面以获得系统用户下拉数据为例，您可以自行按需更改',
        $required: false
      }
    },
    props(_, { t }) {
      return localeProps(t, name + '.props', [
        makeRequiredRule(),
        {
          type: 'input',
          field: 'restful',
          title: 'restful api 接口',
          value: '/system/user/simple-list'
        },
        { type: 'input', field: 'labelField', title: 'label 属性', value: 'nickname' },
        { type: 'input', field: 'valueField', title: 'value 属性', value: 'id' },
        ...selectRule
      ])
    }
  }
}
