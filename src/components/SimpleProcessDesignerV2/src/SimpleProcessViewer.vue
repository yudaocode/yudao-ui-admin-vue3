<template>
  <div class="simple-flow-canvas" v-loading="loading">
    <div  class="simple-flow-container">
      <div class="scale-container" :style="`transform: scale(${scaleValue / 100});`">
        <ProcessNodeTree v-if="processNodeTree" v-model:flow-node="processNodeTree"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProcessNodeTree from './ProcessNodeTree.vue'
import { SimpleFlowNode } from './consts'

defineOptions({
  name: 'SimpleProcessRender'
})

const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
const loading = ref(false)

watch(
  () => props.flowNode,
  (newValue) => {
    processNodeTree.value = newValue
  }
)
const processNodeTree = ref<SimpleFlowNode | undefined>(props.flowNode)
provide('readonly', true)
let scaleValue = ref(100)
const MAX_SCALE_VALUE = 200
const MIN_SCALE_VALUE = 50
// 放大
const zoomOut = () => {
  if (scaleValue.value == MAX_SCALE_VALUE) {
    return
  }
  scaleValue.value += 10
}
// 缩小
const zoomIn = () => {
  if (scaleValue.value == MIN_SCALE_VALUE) {
    return
  }
  scaleValue.value -= 10
}

// onMounted(async () => {
//   try {
//     loading.value = true
//     if (props.view) {
//       processNodeTree.value = props.view.simpleModel
//     }
//   } finally {
//     loading.value = false
//   }
// })
</script>
