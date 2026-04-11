import { generateUUID } from '@/utils'
import { localeProps, makeRequiredRule } from '@/components/FormCreate/src/utils'
import { AreaLevelEnum } from '@/utils/constants'

/**
 * 省市区选择器规则
 */
export const useAreaSelectRule = () => {
  const label = '省市区选择器'
  const name = 'AreaSelect'

  return {
    icon: 'icon-location',
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
      return localeProps(t, name + '.props', [
        makeRequiredRule(),
        {
          type: 'select',
          field: 'level',
          title: '选择层级',
          value: AreaLevelEnum.DISTRICT,
          options: [
            { label: '省', value: AreaLevelEnum.PROVINCE },
            { label: '省/市', value: AreaLevelEnum.CITY },
            { label: '省/市/区', value: AreaLevelEnum.DISTRICT }
          ],
          info: '限制可选择的地区层级'
        },
        {
          type: 'input',
          field: 'placeholder',
          title: '占位符',
          value: '请选择省市区'
        },
        {
          type: 'switch',
          field: 'clearable',
          title: '是否可清空',
          value: true
        },
        {
          type: 'switch',
          field: 'showAllLevels',
          title: '显示完整路径',
          value: true,
          info: '输入框中是否显示选中值的完整路径'
        },
        {
          type: 'input',
          field: 'separator',
          title: '分隔符',
          value: '/',
          info: '选项分隔符'
        },
        {
          type: 'switch',
          field: 'disabled',
          title: '是否禁用',
          value: false
        }
      ])
    }
  }
}
