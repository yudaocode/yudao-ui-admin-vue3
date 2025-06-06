import { generateUUID } from '@/utils'
import * as DictDataApi from '@/api/system/dict/dict.type'
import { localeProps, makeRequiredRule } from '@/components/FormCreate/src/utils'
import { selectRule } from '@/components/FormCreate/src/config/selectRule'
import { cloneDeep } from 'lodash-es'

/**
 * 字典选择器规则，如果规则使用到动态数据则需要单独配置不能使用 useSelectRule
 */
export const useDictSelectRule = () => {
  const label = '字典选择器'
  const name = 'DictSelect'
  const rules = cloneDeep(selectRule)
  const dictOptions = ref<{ label: string; value: string }[]>([]) // 字典类型下拉数据
  onMounted(async () => {
    const data = await DictDataApi.getSimpleDictTypeList()
    if (!data || data.length === 0) {
      return
    }
    dictOptions.value =
      data?.map((item: DictDataApi.DictTypeVO) => ({
        label: item.name,
        value: item.type
      })) ?? []
  })
  return {
    icon: 'icon-doc-text',
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
          field: 'dictType',
          title: '字典类型',
          value: '',
          options: dictOptions.value
        },
        {
          type: 'select',
          field: 'valueType',
          title: '字典值类型',
          value: 'str',
          options: [
            { label: '数字', value: 'int' },
            { label: '字符串', value: 'str' },
            { label: '布尔值', value: 'bool' }
          ]
        },
        ...rules
      ])
    }
  }
}
