<script lang="tsx">
import { defineComponent, PropType, computed } from 'vue'
import { isHexColor } from '@/utils/color'
import { ElTag } from 'element-plus'
import { DictDataType, getDictOptions } from '@/utils/dict'
import { isArray, isString, isNumber, isBoolean } from '@/utils/is'

export default defineComponent({
  name: 'DictTag',
  props: {
    type: {
      type: String as PropType<string>,
      required: true
    },
    value: {
      type: [String, Number, Boolean, Array],
      required: true
    },
    // 字符串分隔符 只有当 props.value 传入值为字符串时有效
    separator: {
      type: String as PropType<string>,
      default: ','
    },
    // 每个 tag 之间的间隔，默认为 5px，参考的 el-row 的 gutter
    gutter: {
      type: String as PropType<string>,
      default: '5px'
    }
  },
  setup(props) {
    const valueArr: any = computed(() => {
      // 1. 是 Number 类型和 Boolean 类型的情况
      if (isNumber(props.value) || isBoolean(props.value)) {
        return [String(props.value)]
      }
      // 2. 是字符串（进一步判断是否有包含分隔符号 -> props.sepSymbol ）
      else if (isString(props.value)) {
        return props.value.split(props.separator)
      }
      // 3. 数组
      else if (isArray(props.value)) {
        return props.value.map(String)
      }
      return []
    })
    const renderDictTag = () => {
      if (!props.type) {
        return null
      }
      // 解决自定义字典标签值为零时标签不渲染的问题
      if (props.value === undefined || props.value === null || props.value === '') {
        return null
      }
      const dictOptions = getDictOptions(props.type)

      return (
        <div
          class="dict-tag"
          style={{
            display: 'inline-flex',
            gap: props.gutter,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {dictOptions.map((dict: DictDataType) => {
            if (valueArr.value.includes(dict.value)) {
              if (dict.colorType + '' === 'primary' || dict.colorType + '' === 'default') {
                dict.colorType = ''
              }
              return (
                // 添加标签的文字颜色为白色，解决自定义背景颜色时标签文字看不清的问题
                <ElTag
                  style={dict?.cssClass ? 'color: #fff' : ''}
                  type={dict?.colorType || null}
                  color={dict?.cssClass && isHexColor(dict?.cssClass) ? dict?.cssClass : ''}
                  disableTransitions={true}
                >
                  {dict?.label}
                </ElTag>
              )
            }
          })}
        </div>
      )
    }
    return () => renderDictTag()
  }
})
</script>
