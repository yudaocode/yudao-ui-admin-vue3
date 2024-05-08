<template>
  <div class="node-wrapper">
    <div class="node-container">
      <div class="node-box" :class="{'node-config-error': !currentNode.showText}">
        <div class="node-title-container">
          <div class="node-title-icon copy-task"><span class="iconfont icon-copy"></span></div>
          <input
            v-if="showInput"
            type="text"
            class="editable-title-input"
            @blur="blurEvent()"
            v-mountedFocus
            v-model="currentNode.name"
            :placeholder="currentNode.name"
          />
          <div v-else class="node-title" @click="clickEvent">
            {{ currentNode.name }}
          </div>
        </div>
        <div class="node-content" @click="openNodeConfig">
          <div class="node-text" :title="currentNode.showText" v-if="currentNode.showText">
            {{ currentNode.showText }}
          </div>
          <div class="node-text"  v-else>
            {{ NODE_DEFAULT_TEXT.get(NodeType.COPY_TASK_NODE) }}
          </div>
          <Icon icon="ep:arrow-right-bold" />
        </div>
        <div class="node-toolbar">
          <div class="toolbar-icon"><Icon  color="#0089ff"  icon="ep:circle-close-filled" :size="18"  @click="deleteNode" /></div>
        </div>
      </div>

      <!-- 传递子节点给添加节点组件。会在子节点前面添加节点 -->
      <NodeHandler v-if="currentNode" v-model:child-node="currentNode.childNode" />
    </div>
    <!-- 其实只需要一个全局抄送节点配置就行, 不需要多个。点击配置的时候传值.  TODO 后面优化 -->
    <CopyTaskNodeConfig
      v-if="currentNode"
      ref="nodeSetting"
      :flow-node="currentNode"
     />
  </div>
</template>
<script setup lang='ts'>
import { SimpleFlowNode, NodeType, NODE_DEFAULT_TEXT, NODE_DEFAULT_NAME } from '../consts'
import NodeHandler from '../NodeHandler.vue'
import CopyTaskNodeConfig from '../nodes-config/CopyTaskNodeConfig.vue';
import { generateUUID } from '@/utils'
defineOptions({
  name: 'CopyTaskNode'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
// 定义事件，更新父组件。
const emits = defineEmits<{
  'update:modelValue': [node: SimpleFlowNode | undefined]
}>()
const currentNode = ref<SimpleFlowNode>(props.flowNode)

// 监控当前节点的变化
watch(
  () => props.flowNode,
  (newValue) => {
    currentNode.value = newValue
  }
)
// 显示节点名称输入框
const showInput = ref(false)
// 节点名称输入框失去焦点
const blurEvent = () => {
  showInput.value = false
  currentNode.value.name = currentNode.value.name || NODE_DEFAULT_NAME.get(NodeType.USER_TASK_NODE) as string
}
// 点击节点标题进行输入
const clickEvent = () => {
  showInput.value = true
}
const nodeSetting = ref()
// 打开节点配置
const openNodeConfig = () => {
  nodeSetting.value.setCurrentNode(currentNode.value);
  nodeSetting.value.open()
}

// 删除节点。更新当前节点为孩子节点
const deleteNode = () => {
  emits('update:modelValue', currentNode.value.childNode)
}
// 复制节点
const copyNode = () => {
  const newCopyNode: SimpleFlowNode = {
    id: generateUUID(),
    name: currentNode.value.name,
    showText: currentNode.value.showText,
    type: currentNode.value.type,
    // 抄送节点配置
    attributes: {
      candidateStrategy: currentNode.value.attributes?.candidateStrategy,
      candidateParam: currentNode.value.attributes?.candidateParam
    },
    childNode: currentNode.value
  }
  currentNode.value = newCopyNode
  emits('update:modelValue', currentNode.value)
}
</script>

<style lang='scss' scoped>

</style>
