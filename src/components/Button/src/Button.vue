<script lang="ts" setup>
import { ButtonType, ComponentSize, ElButton } from 'element-plus'
import { Component, computed, PropType, unref } from 'vue'
import { useDesign } from '@/hooks/web/useDesign'
import { useAppStore } from '@/store/modules/app'

defineOptions({ name: 'BaseButton' })

const appStore = useAppStore()

const getTheme = computed(() => appStore.getTheme)

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('button')

// 未传的属性保持 undefined，交给 ElButton 按 ElForm / ElButtonGroup / 全局配置取默认值
const props = defineProps({
  size: {
    type: String as PropType<ComponentSize>,
    default: undefined
  },
  type: {
    type: String as PropType<ButtonType>,
    default: undefined
  },
  disabled: {
    type: Boolean,
    default: undefined
  },
  plain: {
    type: Boolean,
    default: undefined
  },
  text: {
    type: Boolean,
    default: undefined
  },
  bg: {
    type: Boolean,
    default: undefined
  },
  link: {
    type: Boolean,
    default: undefined
  },
  round: {
    type: Boolean,
    default: undefined
  },
  circle: {
    type: Boolean,
    default: undefined
  },
  loading: {
    type: Boolean,
    default: undefined
  },
  loadingIcon: {
    type: [String, Object] as PropType<string | Component>,
    default: undefined
  },
  icon: {
    type: [String, Object] as PropType<string | Component>,
    default: undefined
  },
  autofocus: {
    type: Boolean,
    default: undefined
  },
  nativeType: {
    type: String as PropType<'button' | 'submit' | 'reset'>,
    default: undefined
  },
  autoInsertSpace: {
    type: Boolean,
    default: undefined
  },
  color: {
    type: String,
    default: ''
  },
  dark: {
    type: Boolean,
    default: undefined
  },
  // 兼容上游的属性名，等同 dark
  darker: {
    type: Boolean,
    default: undefined
  },
  tag: {
    type: [String, Object] as PropType<string | Component>,
    default: undefined
  }
})

const emit = defineEmits<{
  (e: 'click', evt: MouseEvent): void
}>()

// 调用方传入的 color 优先；否则实心 primary 按钮使用当前主题色。
// plain / text / link 不传 color，由 ElButton 按 type 及主题 CSS 变量着色
const color = computed(() => {
  const { color, type, plain, text, link } = props
  if (color) {
    return color
  }
  if (type === 'primary' && !plain && !text && !link) {
    return unref(getTheme).elColorPrimary || ''
  }
  return ''
})

const bindProps = computed(() => {
  const delArr: string[] = ['darker', 'color']
  const source = props as Recordable
  const obj: Recordable = {}
  for (const key in source) {
    if (delArr.indexOf(key) === -1 && source[key] !== undefined) {
      obj[key] = source[key]
    }
  }
  if (obj.dark === undefined && props.darker !== undefined) {
    obj.dark = props.darker
  }
  if (unref(color)) {
    obj.color = unref(color)
  }
  return obj
})

// ElButton 在 disabled / loading 时不会触发 click
const handleClick = (evt: MouseEvent) => {
  emit('click', evt)
}
</script>

<template>
  <ElButton v-bind="bindProps" :class="prefixCls" @click="handleClick">
    <template v-if="$slots.icon" #icon>
      <slot name="icon"></slot>
    </template>
    <template v-if="$slots.loading" #loading>
      <slot name="loading"></slot>
    </template>
    <template v-if="$slots.default" #default>
      <slot></slot>
    </template>
  </ElButton>
</template>
