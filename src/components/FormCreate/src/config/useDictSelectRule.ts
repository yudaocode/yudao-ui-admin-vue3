import { generateUUID } from '@/utils'
import * as DictDataApi from '@/api/system/dict/dict.type'
import { localeProps, makeRequiredRule } from '@/components/FormCreate/src/utils'

export const useDictSelectRule = () => {
  const label = '字典选择器'
  const name = 'DictSelect'
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
        { type: 'switch', field: 'multiple', title: '是否多选' },
        {
          type: 'switch',
          field: 'disabled',
          title: '是否禁用'
        },
        { type: 'switch', field: 'clearable', title: '是否可以清空选项' },
        {
          type: 'switch',
          field: 'collapseTags',
          title: '多选时是否将选中值按文字的形式展示'
        },
        {
          type: 'inputNumber',
          field: 'multipleLimit',
          title: '多选时用户最多可以选择的项目数，为 0 则不限制',
          props: { min: 0 }
        },
        {
          type: 'input',
          field: 'autocomplete',
          title: 'autocomplete 属性'
        },
        { type: 'input', field: 'placeholder', title: '占位符' },
        {
          type: 'switch',
          field: 'filterable',
          title: '是否可搜索'
        },
        { type: 'switch', field: 'allowCreate', title: '是否允许用户创建新条目' },
        {
          type: 'input',
          field: 'noMatchText',
          title: '搜索条件无匹配时显示的文字'
        },
        {
          type: 'switch',
          field: 'remote',
          title: '其中的选项是否从服务器远程加载'
        },
        {
          type: 'Struct',
          field: 'remoteMethod',
          title: '自定义远程搜索方法'
        },
        { type: 'input', field: 'noDataText', title: '选项为空时显示的文字' },
        {
          type: 'switch',
          field: 'reserveKeyword',
          title: '多选且可搜索时，是否在选中一个选项后保留当前的搜索关键词'
        },
        {
          type: 'switch',
          field: 'defaultFirstOption',
          title: '在输入框按下回车，选择第一个匹配项'
        },
        {
          type: 'switch',
          field: 'popperAppendToBody',
          title: '是否将弹出框插入至 body 元素',
          value: true
        },
        {
          type: 'switch',
          field: 'automaticDropdown',
          title: '对于不可搜索的 Select，是否在输入框获得焦点后自动弹出选项菜单'
        }
      ])
    }
  }
}
