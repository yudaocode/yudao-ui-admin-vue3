<template>
  <div class="node-wrapper">
    <div class="node-container">
      <div class="node-box" :class="{'node-config-error': !flowNode.showText}">
        <div class="node-title-container">
          <div class="node-title-icon"><Icon icon="ep:avatar" /></div>
          <input
            v-if="showInput"
            type="text"
            class="editable-title-input"
            @blur="blurEvent($event)"
            @focus="focusEvent($event)"
            v-mountedFocus
            v-model="currentNode.name"
            :placeholder="currentNode.name"
          />
          <div v-else class="node-title" @click="clickEvent">
            {{ currentNode.name }}
          </div>
        </div>
        <div class="node-content" @click="commonNodeConfig">
          <div class="node-text" :title="flowNode.showText" v-if="flowNode.showText">
            {{ flowNode.showText }}
          </div>
          <div class="node-text"  v-else>
            {{ NODE_DEFAULT_TEXT.get(NodeType.USER_TASK_NODE) }}
          </div>
          <Icon icon="ep:arrow-right-bold" />
        </div>
        <div class="node-toolbar">
          <div class="toolbar-icon"><Icon icon="ep:document-copy" @click="copyNode" /></div>
          <div class="toolbar-icon"><Icon icon="ep:delete" @click="deleteNode" /></div>
        </div>
      </div>

      <!-- title="朱文宣妈妈, 许颖嘉, 王禹昊妈妈, 王亦心爸爸, 朱彧兮妈妈, 陈语馨爸爸, 蔡知妤爸爸/蔡知妍爸爸, 蒋昂倬妈妈, 胡恒智爸爸, 杨晞宇妈妈, 赵嘉依妈妈, 罗嘉懿爸爸, 郑辰希妈妈, 周慕然爸爸, 方张霖妈妈, 张若轩妈妈, 王亦心妈妈, 董子夏妈妈, 刘昱君妈妈/刘畅妈妈, 李子琦妈妈, 解宛芙妈妈, 洪栎妈妈, 陈涂晟爸爸, 张泽锴妈妈, 杨晞宇爸爸, 高鸿轩妈妈, 张然妈妈, 景晗亿妈妈, 郑炜彤妈妈, 祝安屹妈妈, 王萧婉妈妈, 朱彧兮爸爸, 李沐辰妈妈, 王元昊爸爸, 罗嘉懿妈妈, 陈语馨妈妈" -->
      <!-- 传递子节点给添加节点组件。会在子节点前面添加节点 -->
      <NodeHandler v-if="currentNode" v-model:child-node="currentNode.childNode" />
    </div>
  </div>
  <UserTaskNodeConfig
    v-if="currentNode"
    ref="nodeSetting"
    :flow-node="currentNode"
    @update:model-value="handleModelValueUpdate"
  />
</template>
<script setup lang="ts">
import { SimpleFlowNode, NodeType, NODE_DEFAULT_TEXT, NODE_DEFAULT_NAME } from '../consts'
import NodeHandler from '../NodeHandler.vue'
import UserTaskNodeConfig from '../nodes-config/UserTaskNodeConfig.vue';
import { generateUUID } from '@/utils'
defineOptions({
  name: 'CommonNode'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
const emits = defineEmits<{
  'update:modelValue': [node: SimpleFlowNode | undefined]
}>()
const nodeSetting = ref()
const commonNodeConfig = () => {
  console.log('nodeSetting', nodeSetting)
  nodeSetting.value.open()
}

const currentNode = ref<SimpleFlowNode>(props.flowNode)
console.log('current common node is ', currentNode)

// 不加这个 COPY 会有问题
watch(
  () => props.flowNode,
  (newValue) => {
    console.log('new value is ', newValue)
    currentNode.value = newValue
  }
)
const showInput = ref(false)
const blurEvent = (event) => {
  console.log('blurEvent', event)
  showInput.value = false
  currentNode.value.name = currentNode.value.name || NODE_DEFAULT_NAME.get(NodeType.USER_TASK_NODE) as string
}
const focusEvent = (event: FocusEvent) => {
  console.log('focusEvent', event)
}
const clickEvent = () => {
  showInput.value = true
}
const handleModelValueUpdate = (updateValue) => {
  emits('update:modelValue', updateValue)
  console.log('user task node handleModelValueUpdate', updateValue)
}
const deleteNode = () => {
  console.log('the child node is ', currentNode.value.childNode)
  emits('update:modelValue', currentNode.value.childNode)
}
const copyNode = () => {
  // const oldChildNode = currentNode.value.childNode
  const newCopyNode: SimpleFlowNode = {
    id: generateUUID(),
    name: currentNode.value.name,
    showText: currentNode.value.showText,
    type: currentNode.value.type,
    // 审批节点配置
    attributes: {
      approveMethod: currentNode.value.attributes?.approveMethod,
      candidateStrategy: currentNode.value.attributes?.candidateStrategy,
      candidateParam: currentNode.value.attributes?.candidateParam
    },
    childNode: currentNode.value
  }
  currentNode.value = newCopyNode
  console.log('current node value', currentNode.value)
  emits('update:modelValue', currentNode.value)
}
</script>
<style lang="scss" scoped></style>
