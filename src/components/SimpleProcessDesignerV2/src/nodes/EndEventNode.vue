<template>
  <div class="end-node-wrapper">
    <div class="end-node-box" :class="taskStatusClass">
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
// 节点任务状态样式
const taskStatusClass = useTaskStatusClass(currentNode.value?.activityStatus)

</script>
<style lang="scss" scoped></style>
