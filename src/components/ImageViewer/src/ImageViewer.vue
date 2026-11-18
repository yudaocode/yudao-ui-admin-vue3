<script lang="ts" setup>
import { PropType } from 'vue'

defineOptions({ name: 'ImageViewer' })

const props = defineProps({
  urlList: {
    type: Array as PropType<string[]>,
    default: (): string[] => []
  },
  zIndex: { type: Number, default: 200 },
  initialIndex: { type: Number, default: 0 },
  infinite: { type: Boolean, default: true },
  hideOnClickModal: { type: Boolean, default: false },
  teleported: { type: Boolean, default: false },
  show: { type: Boolean, default: false }
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
