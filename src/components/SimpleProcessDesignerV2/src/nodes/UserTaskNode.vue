<template>
  <div class="node-wrapper">
    <div class="node-container">
      <div class="node-box" :class="{ 'node-config-error': !currentNode.showText }">
        <div class="node-title-container">
          <div class="node-title-icon user-task"><span class="iconfont icon-approve"></span></div>
          <input
            v-if="showInput"
            type="text"
            class="editable-title-input"
            @blur="blurEvent()"
            v-mountedFocus
            v-model="currentNode.name"
            :placeholder="currentNode.name"
          />
          <div v-else class="node-title" @click="clickTitle">
            {{ currentNode.name }}
          </div>
        </div>
        <div class="node-content" @click="openNodeConfig">
          <div class="node-text" :title="currentNode.showText" v-if="currentNode.showText">
            {{ currentNode.showText }}
          </div>
          <div class="node-text" v-else>
            {{ NODE_DEFAULT_TEXT.get(NodeType.USER_TASK_NODE) }}
          </div>
          <Icon icon="ep:arrow-right-bold" />
        </div>
        <div class="node-toolbar">
          <div class="toolbar-icon"
            ><Icon color="#0089ff" icon="ep:circle-close-filled" :size="18" @click="deleteNode"
          /></div>
        </div>
      </div>
      <!-- 传递子节点给添加节点组件。会在子节点前面添加节点 -->
      <NodeHandler v-if="currentNode" v-model:child-node="currentNode.childNode" />
    </div>
  </div>
  <UserTaskNodeConfig
    v-if="currentNode"
    ref="nodeSetting"
    :flow-node="currentNode"
    @find:return-task-nodes="findReturnTaskNodes"
  />
</template>
<script setup lang="ts">
import { SimpleFlowNode, NodeType, NODE_DEFAULT_TEXT } from '../consts'
import { useWatchNode, useNodeName2 } from '../node'
import NodeHandler from '../NodeHandler.vue'
import UserTaskNodeConfig from '../nodes-config/UserTaskNodeConfig.vue'
defineOptions({
  name: 'UserTaskNode'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
const emits = defineEmits<{
  'update:flowNode': [node: SimpleFlowNode | undefined]
  'find:parentNode': [nodeList: SimpleFlowNode[], nodeType: NodeType]
}>()
// 监控节点变化
const currentNode = useWatchNode(props)
// 节点名称编辑
const { showInput, blurEvent, clickTitle } = useNodeName2(currentNode, NodeType.START_USER_NODE)
const nodeSetting = ref()
// 打开节点配置
const openNodeConfig = () => {
  // 把当前节点传递给配置组件
  nodeSetting.value.showUserTaskNodeConfig(currentNode.value)
  nodeSetting.value.openDrawer()
}

const deleteNode = () => {
  emits('update:flowNode', currentNode.value.childNode)
}

// 查找可以驳回用户节点
const findReturnTaskNodes = (
  matchNodeList: SimpleFlowNode[] // 匹配的节点
) => {
  // 从父节点查找
  emits('find:parentNode', matchNodeList, NodeType.USER_TASK_NODE)
}
</script>
<style lang="scss" scoped></style>
