<template>
  <div class="node-wrapper">
    <div class="node-container">
      <div
        class="node-box"
        :class="[
          { 'node-config-error': !currentNode.showText },
          `${useTaskStatusClass(currentNode?.activityStatus)}`
        ]"
      >
        <div class="node-title-container">
          <div
            :class="`node-title-icon ${currentNode.childProcessSetting?.async === true ? 'async-child-process' : 'child-process'}`"
          >
            <span
              :class="`iconfont ${currentNode.childProcessSetting?.async === true ? 'icon-async-child-process' : 'icon-child-process'}`"
            >
            </span>
          </div>
          <input
            v-if="!readonly && showInput"
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
            {{ NODE_DEFAULT_TEXT.get(NodeType.CHILD_PROCESS_NODE) }}
          </div>
          <Icon v-if="!readonly" icon="ep:arrow-right-bold" />
        </div>
        <div v-if="!readonly" class="node-toolbar">
          <div class="toolbar-icon"
            ><Icon color="#0089ff" icon="ep:circle-close-filled" :size="18" @click="deleteNode"
          /></div>
        </div>
      </div>

      <!-- 传递子节点给添加节点组件。会在子节点前面添加节点 -->
      <NodeHandler
        v-if="currentNode"
        v-model:child-node="currentNode.childNode"
        :current-node="currentNode"
      />
    </div>
    <ChildProcessNodeConfig
      v-if="!readonly && currentNode"
      ref="nodeSetting"
      :flow-node="currentNode"
    />
  </div>
</template>

<script setup lang="ts">
import { SimpleFlowNode, NodeType, NODE_DEFAULT_TEXT } from '../consts'
import NodeHandler from '../NodeHandler.vue'
import { useNodeName2, useWatchNode, useTaskStatusClass } from '../node'
import ChildProcessNodeConfig from '../nodes-config/ChildProcessNodeConfig.vue'

defineOptions({
  name: 'ChildProcessNode'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
// 定义事件，更新父组件。
const emits = defineEmits<{
  'update:flowNode': [node: SimpleFlowNode | undefined]
}>()
// 是否只读
const readonly = inject<Boolean>('readonly')
// 监控节点的变化
const currentNode = useWatchNode(props)
// 节点名称编辑
const { showInput, blurEvent, clickTitle } = useNodeName2(currentNode, NodeType.CHILD_PROCESS_NODE)
const nodeSetting = ref()

// 打开节点配置
const openNodeConfig = () => {
  if (readonly) {
    return
  }
  nodeSetting.value.showChildProcessNodeConfig(currentNode.value)
  nodeSetting.value.openDrawer()
}

// 删除节点。更新当前节点为孩子节点
const deleteNode = () => {
  emits('update:flowNode', currentNode.value.childNode)
}
</script>

<style scoped></style>
