<template>
  <div
    :style="{
      ...style,
      background: property.bgType === 'color' ? property.bgColor : `url(${property.bgImg})`
    }"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ComponentStyle } from '@/components/DiyEditor/util'

/**
 * 组件容器
 * 用于包裹组件，为组件提供 背景、外边距、内边距、边框等样式
 */
defineOptions({ name: 'ComponentContainer' })

const props = defineProps<{ property: ComponentStyle }>()

const style = computed(() => {
  if (!props.property) {
    return {}
  }
  return {
    marginTop: `${props.property.marginTop || 0}px`,
    marginBottom: `${props.property.marginBottom || 0}px`,
    marginLeft: `${props.property.marginLeft || 0}px`,
    marginRight: `${props.property.marginRight || 0}px`,
    paddingTop: `${props.property.paddingTop || 0}px`,
    paddingRight: `${props.property.paddingRight || 0}px`,
    paddingBottom: `${props.property.paddingBottom || 0}px`,
    paddingLeft: `${props.property.paddingLeft || 0}px`,
    borderTopLeftRadius: `${props.property.borderTopLeftRadius || 0}px`,
    borderTopRightRadius: `${props.property.borderTopRightRadius || 0}px`,
    borderBottomRightRadius: `${props.property.borderBottomRightRadius || 0}px`,
    borderBottomLeftRadius: `${props.property.borderBottomLeftRadius || 0}px`,
    overflow: 'hidden'
  }
})
</script>

<style scoped lang="scss"></style>
