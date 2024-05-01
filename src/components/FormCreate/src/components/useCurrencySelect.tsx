import request from '@/config/axios'
import { isEmpty } from '@/utils/is'
import { CurrencySelectProps } from '@/components/FormCreate/src/type'
import { getBoolDictOptions, getIntDictOptions, getStrDictOptions } from '@/utils/dict'

export const useCurrencySelect = (option: CurrencySelectProps) => {
  return defineComponent({
    name: option.name,
    props: {
      // 选项标签
      labelField: {
        type: String,
        default: () => option.labelField ?? 'label'
      },
      // 选项的值
      valueField: {
        type: String,
        default: () => option.valueField ?? 'value'
      },
      // api 接口
      restful: {
        type: String,
        default: () => option.restful ?? ''
      },
      // 字典类型
      dictType: {
        type: String,
        default: ''
      },
      // 字典值类型 'str' | 'int' | 'bool'
      dictValueType: {
        type: String,
        default: 'str'
      },
      // 选择器类型，下拉框 select、多选框 checkbox、单选框 radio
      selectType: {
        type: String,
        default: 'select'
      }
    },
    setup(props) {
      const attrs = useAttrs()
      const options = ref<any[]>([]) // 下拉数据
      const getOptions = async () => {
        options.value = []
        // 字典选择器
        if (option.isDict) {
          options.value = getDictOptions()
          return
        }
        // 接口选择器
        if (isEmpty(props.restful)) {
          return
        }
        // TODO 只支持 GET 查询，复杂下拉构建条件请使用业务表单
        const data = await request.get({ url: props.restful })
        if (Array.isArray(data)) {
          options.value = data.map((item: any) => ({
            label: item[props.labelField],
            value: item[props.valueField]
          }))
          return
        }
        console.log(`接口[${props.restful}] 返回结果不是一个数组`)
      }
      // 获得字典配置
      const getDictOptions = () => {
        switch (props.dictValueType) {
          case 'str':
            return getStrDictOptions(props.dictType)
          case 'int':
            return getIntDictOptions(props.dictType)
          case 'bool':
            return getBoolDictOptions(props.dictType)
          default:
            return []
        }
      }
      onMounted(async () => {
        await getOptions()
      })
      const buildSelect = () => {
        return (
          <>
            <el-select class="w-1/1" {...attrs}>
              {options.value.map((item, index) => (
                <el-option key={index} label={item.label} value={item.value} />
              ))}
            </el-select>
          </>
        )
      }
      const buildCheckbox = () => {
        if (isEmpty(options.value)) {
          options.value = [
            { label: '选项1', value: '选项1' },
            { label: '选项2', value: '选项2' }
          ]
        }
        return (
          <>
            <el-checkbox-group class="w-1/1" {...attrs}>
              {options.value.map((item, index) => (
                <el-checkbox key={index} label={item.label} value={item.value} />
              ))}
            </el-checkbox-group>
          </>
        )
      }
      const buildRadio = () => {
        if (isEmpty(options.value)) {
          options.value = [
            { label: '选项1', value: '选项1' },
            { label: '选项2', value: '选项2' }
          ]
        }
        return (
          <>
            <el-radio-group class="w-1/1" {...attrs}>
              {options.value.map((item, index) => (
                <el-radio key={index} value={item.value}>
                  {item.label}
                </el-radio>
              ))}
            </el-radio-group>
          </>
        )
      }
      return () => (
        <>
          {props.selectType === 'select'
            ? buildSelect()
            : props.selectType === 'radio'
              ? buildRadio()
              : props.selectType === 'checkbox'
                ? buildCheckbox()
                : buildSelect()}
        </>
      )
    }
  })
}
