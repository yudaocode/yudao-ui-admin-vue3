<template>
    <SimpleProcessModel :flow-node="simpleModel" :readonly="true"/>
</template>

<script setup lang="ts">
import { useWatchNode } from './node'
import { SimpleFlowNode } from './consts'

defineOptions({
  name: 'SimpleProcessViewer'
})

const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  },
  // 流程任务
  tasks : {
    type : Array,
    default: () => [] as any[]
  }
})
const simpleModel = useWatchNode(props)
</script>
