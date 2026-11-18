<script lang="tsx">
import { defineComponent, getCurrentInstance, PropType, h, VNode } from 'vue'

export default defineComponent({
  name: 'Highlight',
  props: {
    tag: { type: String, default: 'span' },
    keys: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    color: { type: String, default: 'var(--el-color-primary)' }
  },
  emits: ['click'],
  setup(props, { emit, slots }) {
    const instance = getCurrentInstance()

    // 调用方是否监听了 click：click 为声明的 emit，监听器不在 $attrs 中，从组件 vnode 原始 props 读取
    const hasClickListener = () => {
      const vnodeProps = instance?.vnode.props
      return !!(vnodeProps?.onClick || vnodeProps?.onClickOnce)
    }

    // 每次命中单独创建节点，同一关键词多次出现不复用同一 VNode；
    // 有 click 监听时，关键词同时可键盘聚焦并以 Enter / 空格触发；无监听时不产生无效的 Tab 停靠点
    const renderKey = (key: string) => {
      const keyboardProps = hasClickListener()
        ? {
            role: 'button',
            tabindex: 0,
            onKeydown: (event: KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                emit('click', key)
              }
            }
          }
        : {}
      return h(
        'span',
        {
          ...keyboardProps,
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
