<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { PropType } from 'vue'

defineOptions({ name: 'XTextButton' })

const props = defineProps({
  modelValue: propTypes.bool.def(false),
  loading: propTypes.bool.def(false),
  preIcon: propTypes.string.def(''),
  postIcon: propTypes.string.def(''),
  title: propTypes.string.def(''),
  type: propTypes.oneOf(['', 'primary', 'success', 'warning', 'danger', 'info']).def('primary'),
  circle: propTypes.bool.def(false),
  round: propTypes.bool.def(false),
  plain: propTypes.bool.def(false),
  onClick: { type: Function as PropType<(...args) => any>, default: null }
})
const getBindValue = computed(() => {
  const delArr: string[] = ['title', 'preIcon', 'postIcon', 'onClick']
  const attrs = useAttrs()
  const obj = { ...attrs, ...props }
  for (const key in obj) {
    if (delArr.indexOf(key) !== -1) {
      delete obj[key]
    }
  }
  return obj
})
</script>

<template>
  <el-button link v-bind="getBindValue" @click="onClick">
    <Icon v-if="preIcon" :icon="preIcon" class="mr-1px" />
    {{ title ? title : '' }}
    <Icon v-if="postIcon" :icon="postIcon" class="mr-1px" />
  </el-button>
</template>
<style lang="scss" scoped>
:deep(.el-button.is-text) {
  padding: 8px 4px;
  margin-left: 0;
}

:deep(.el-button.is-link) {
  padding: 8px 4px;
  margin-left: 0;
}
</style>
