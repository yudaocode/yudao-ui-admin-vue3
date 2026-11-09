<script lang="ts" setup>
import { PropType } from 'vue'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'ImageViewer' })

const props = defineProps({
  urlList: {
    type: Array as PropType<string[]>,
    default: (): string[] => []
  },
  zIndex: propTypes.number.def(200),
  initialIndex: propTypes.number.def(0),
  infinite: propTypes.bool.def(true),
  hideOnClickModal: propTypes.bool.def(false),
  teleported: propTypes.bool.def(false),
  show: propTypes.bool.def(false)
})

const getBindValue = computed(() => {
  const propsData: Recordable = { ...props }
  delete propsData.show
  return propsData
})

// 关闭时通知外部（程序式 createImageViewer 据此卸载并移除容器）
const emit = defineEmits<{ (e: 'close'): void }>()

const show = ref(props.show)

const close = () => {
  show.value = false
  emit('close')
}
</script>

<template>
  <ElImageViewer v-if="show" v-bind="getBindValue" @close="close" />
</template>
