<script lang="tsx">
import { defineComponent, PropType, h, VNode } from 'vue'
import { propTypes } from '@/utils/propTypes'

export default defineComponent({
  name: 'Highlight',
  props: {
    tag: propTypes.string.def('span'),
    keys: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    color: propTypes.string.def('var(--el-color-primary)')
  },
  emits: ['click'],
  setup(props, { emit, slots }) {
    // 每次命中单独创建节点，同一关键词多次出现不复用同一 VNode
    const renderKey = (key: string) => {
      return h(
        'span',
        {
          onClick: () => {
            emit('click', key)
          },
          style: {
            color: props.color,
            cursor: 'pointer'
          }
        },
        key
      )
    }

    // 按字面量切分文本（参考 IAgree）：关键词不作为正则，正文中的数字、{{0}} 不会误判为命中；
    // 每次取当前位置之后最早命中的关键词，同一位置按 keys 顺序优先；跳过空关键词
    const parseText = (text: string) => {
      const nodes: Array<string | VNode> = []
      let index = 0
      while (index < text.length) {
        let matchIndex = -1
        let matchKey = ''
        for (const key of props.keys) {
          if (!key) continue
          const position = text.indexOf(key, index)
          if (position !== -1 && (matchIndex === -1 || position < matchIndex)) {
            matchIndex = position
            matchKey = key
          }
        }
        if (matchIndex === -1) break
        if (matchIndex > index) {
          nodes.push(text.slice(index, matchIndex))
        }
        nodes.push(renderKey(matchKey))
        index = matchIndex + matchKey.length
      }
      if (index < text.length) {
        nodes.push(text.slice(index))
      }
      return nodes
    }

    const renderText = () => {
      if (!slots?.default) return null
      const node = slots?.default()[0].children

      // 非文本内容原样渲染
      if (!node || typeof node !== 'string') {
        return slots?.default()[0]
      }

      return h(props.tag, parseText(node))
    }

    return () => renderText()
  }
})
</script>
