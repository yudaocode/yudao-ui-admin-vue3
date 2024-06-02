<template>
  <!-- 开始节点 -->
  <StartEventNode
    v-if="currentNode && currentNode.type === NodeType.START_EVENT_NODE"
    :flow-node="currentNode"
    @update:model-value="handleModelValueUpdate"
  />
  <!-- 审批节点 -->
  <UserTaskNode
    v-if="currentNode && currentNode.type === NodeType.USER_TASK_NODE"
    :flow-node="currentNode"
    @update:model-value="handleModelValueUpdate"
    @find:parent-node="findFromParentNode"
  />
  <!-- 抄送节点 -->
  <CopyTaskNode
    v-if="currentNode && currentNode.type === NodeType.COPY_TASK_NODE"
    :flow-node="currentNode"
    @update:model-value="handleModelValueUpdate"
  />
  <!-- 条件节点 -->
  <ExclusiveNode
    v-if="currentNode && currentNode.type === NodeType.EXCLUSIVE_NODE"
    :flow-node="currentNode"
    @update:model-value="handleModelValueUpdate"
    @find:parent-node="findFromParentNode"
  />
   <!-- 并行节点 -->
   <ParallelNode
    v-if="currentNode && currentNode.type === NodeType.PARALLEL_NODE_FORK"
    :flow-node="currentNode"
    @update:model-value="handleModelValueUpdate"
    @find:parent-node="findFromParentNode"
  />
  <!-- 递归显示孩子节点  -->
  <ProcessNodeTree
    v-if="currentNode && currentNode.childNode"
    v-model:flow-node="currentNode.childNode"
    :parent-node= "currentNode"
    @find:recursive-find-parent-node="recursiveFindParentNode"
  />

  <!-- 结束节点 -->
  <EndEventNode v-if="currentNode && currentNode.type === NodeType.END_EVENT_NODE" />
</template>
<script setup lang="ts">
import StartEventNode from './nodes/StartEventNode.vue'
import EndEventNode from './nodes/EndEventNode.vue'
import UserTaskNode from './nodes/UserTaskNode.vue'
import CopyTaskNode from './nodes/CopyTaskNode.vue'
import ExclusiveNode from './nodes/ExclusiveNode.vue'
import ParallelNode from './nodes/ParallelNode.vue'
import { SimpleFlowNode, NodeType } from './consts'
defineOptions({
  name: 'ProcessNodeTree'
})
const props = defineProps({
  parentNode: {
    type: Object as () => SimpleFlowNode,
    default: () => null
  },
  flowNode: {
    type: Object as () => SimpleFlowNode,
    default: () => null
  }
})
const emits = defineEmits<{
  'update:flowNode',
  'find:recursiveFindParentNode': [nodeList: SimpleFlowNode[], curentNode: SimpleFlowNode, nodeType: number]
}>()


const currentNode = ref<SimpleFlowNode>(props.flowNode)

// 重要：监控节点变化. 重新绘制节点
watch(
  () => props.flowNode,
  (newValue) => {
    currentNode.value = newValue
  }
)

const handleModelValueUpdate = (updateValue) => {
  console.log('Process Node Tree handleModelValueUpdate', updateValue)
  emits('update:flowNode', updateValue)
}

const findFromParentNode = (
  nodeList: SimpleFlowNode[],
  nodeType: number
) => {
  emits('find:recursiveFindParentNode', nodeList, props.parentNode, nodeType)
}

// 递归从父节点中查询匹配的节点
const recursiveFindParentNode = (
  nodeList: SimpleFlowNode[],
  findNode: SimpleFlowNode,
  nodeType: number
) => {
  if (!findNode || findNode.type === NodeType.START_EVENT_NODE) {
    return
  }

  if (findNode.type === nodeType) {
    nodeList.push(findNode)
  }
  emits('find:recursiveFindParentNode', nodeList, props.parentNode, nodeType)
}
</script>
<style lang="scss" scoped></style>
