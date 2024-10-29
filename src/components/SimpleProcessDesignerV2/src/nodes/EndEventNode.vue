<template>
  <div class="end-node-wrapper">
    <div class="end-node-box" :class="`${useTaskStatusClass(currentNode?.activityStatus)}`">
      <span class="node-fixed-name" title="结束">结束</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { SimpleFlowNode } from '../consts'
import { useWatchNode, useTaskStatusClass } from '../node'

defineOptions({
  name: 'EndEventNode'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    default: () => null
  }
})
// 监控节点变化
const currentNode = useWatchNode(props)

</script>
<style lang="scss" scoped></style>
