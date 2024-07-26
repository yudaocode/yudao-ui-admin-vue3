<script lang="tsx">
import { defineComponent, PropType, computed } from 'vue'
import { isHexColor } from '@/utils/color'
import { ElTag } from 'element-plus'
import { DictDataType, getDictOptions } from '@/utils/dict'
import { isArray, isString, isNumber } from '@/utils/is'

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
    }
  },
  setup(props) {
    const valueArr: any = computed(() => {
      // 1.是Number类型的情况
      if (isNumber(props.value)) {
        return [String(props.value)]
      }
      // 2.是字符串（进一步判断是否有','）
      else if (isString(props.value)) {
        return props.value.includes(',') ? props.value.split(',') : [String(props.value)]
      }
      // 3.数组
      else if (isArray(props.value)) {
        return props.value.map(String)
      }
    })
    const rederDictTag = () => {
      if (!props.type) {
        return null
      }
      // 解决自定义字典标签值为零时标签不渲染的问题
      if (props.value === undefined || props.value === null || props.value === '') {
        return null
      }
      const dictOptions = getDictOptions(props.type)

      return (
        <div class="dict-tag">
          {dictOptions.map((dict: DictDataType) => {
            if (valueArr.value.includes(dict.value)) {
              if (dict.colorType + '' === 'primary' || dict.colorType + '' === 'default') {
                dict.colorType = ''
              }
              return (
                // 添加标签的文字颜色为白色，解决自定义背景颜色时标签文字看不清的问题
                <ElTag
                  style={dict?.cssClass ? 'color: #fff' : ''}
                  type={dict?.colorType}
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
    return () => rederDictTag()
  }
})
</script>
