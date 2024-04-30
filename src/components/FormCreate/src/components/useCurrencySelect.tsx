import request from '@/config/axios'
import { isEmpty } from '@/utils/is'
import { CurrencySelectProps } from '@/components/FormCreate/src/type'

export const useCurrencySelect = (option: CurrencySelectProps) => {
  return defineComponent({
    name: option.name,
    props: {
      // 字典类型
      labelField: {
        type: String,
        default: () => option.labelField ?? ''
      },
      // 字典值类型
      valueField: {
        type: String,
        default: () => option.valueField ?? ''
      },
      // api 接口
      restful: {
        type: String,
        default: () => option.restful ?? ''
      }
    },
    setup(props) {
      const attrs = useAttrs()
      const options = ref<any[]>([]) // 下拉数据
      const getOptions = async () => {
        options.value = []
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

      onMounted(async () => {
        await getOptions()
      })
      return () => (
        <>
          <el-select className="w-1/1" {...attrs}>
            {options.value.map((item, index) => (
              <el-option key={index} label={item.label} value={item.value} />
            ))}
          </el-select>
        </>
      )
    }
  })
}
