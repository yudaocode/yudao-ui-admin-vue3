<template>
  <div class="branch-node-wrapper">
    <div class="branch-node-container">
      <div class="branch-node-add" @click="addCondition">添加条件</div>
      <div
        class="branch-node-item"
        v-for="(item, index) in currentNode.conditionNodes"
        :key="index"
      >
        <template v-if="index == 0">
          <div class="branch-line-first-top"></div>
          <div class="branch-line-first-bottom"></div>
        </template>
        <template v-if="index + 1 == currentNode.conditionNodes?.length">
          <div class="branch-line-last-top"></div>
          <div class="branch-line-last-bottom"></div>
        </template>
        <div class="node-wrapper">
          <div class="node-container">
            <div class="node-box" :class="{'node-config-error': !item.showText}">
              <div class="branch-node-title-container">
                <div class="branch-title" v-if="showInputs[index]">
                  <input
                    type="text"
                    class="input-max-width editable-title-input"
                    @blur="blurEvent(index)"
                    v-mountedFocus
                    v-model="item.name"
                  />
                </div>
                <div v-else class="branch-title" @click="clickEvent(index)"> {{ item.name }} </div>
                <div class="branch-priority"> 优先级{{ index + 1 }} </div>
              </div>
              <div class="node-content" @click="conditionNodeConfig(item.id)">
                <div class="node-text" :title="item.showText" v-if ="item.showText">
                  {{ item.showText }}
                </div>
                <div class="node-text" v-else >
                  {{ NODE_DEFAULT_TEXT.get(NodeType.CONDITION_NODE) }}
                </div>
                <Icon icon="ep:arrow-right-bold" />
              </div>
              <div class="node-toolbar" v-if="index + 1 !== currentNode.conditionNodes?.length">
                <div class="toolbar-icon"><Icon  icon="ep:circle-close"  @click="deleteCondition(index)"/></div>
              </div>
            </div>
            <NodeHandler v-model:child-node="item.childNode" />
          </div>
        </div>
        <ConditionNodeConfig :condition-node="item" :ref="item.id" />
        <!-- 递归显示子节点  -->
        <ProcessNodeTree  v-if="item && item.childNode" v-model:flow-node="item.childNode" />
      </div>
    </div>
    <NodeHandler v-if="currentNode" v-model:child-node="currentNode.childNode" />
  </div>
</template>

<script setup lang="ts">
import NodeHandler from '../NodeHandler.vue'
import ProcessNodeTree from '../ProcessNodeTree.vue'
import { SimpleFlowNode, NodeType, NODE_DEFAULT_TEXT } from '../consts'
import { generateUUID } from '@/utils'
import ConditionNodeConfig from '../nodes-config/ConditionNodeConfig.vue'
const { proxy } = getCurrentInstance() as any
defineOptions({
  name: 'ExclusiveNode'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
// 定义事件，更新父组件
const emits = defineEmits<{
  'update:modelValue': [node : SimpleFlowNode | undefined]
}>()

const currentNode = ref<SimpleFlowNode>(props.flowNode)
// const conditionNodes = computed(() => currentNode.value.conditionNodes);

watch(() => props.flowNode, (newValue) => {  
  currentNode.value = newValue;  
});
// TODO 测试后续去掉
// watch(() => conditionNodes, (newValue) => {  
//   console.log('new conditionNodes is ', newValue);
// },{ deep: true }); 

const showInputs = ref<boolean[]>([])
// 失去焦点
const blurEvent = (index:number) => {
  showInputs.value[index] = false
  const conditionNode =  currentNode.value.conditionNodes?.at(index) as SimpleFlowNode;
  conditionNode.name =  conditionNode.name || '条件' + index
}
// 点击条件名称
const clickEvent = (index:number) => {
  showInputs.value[index] = true
}

const conditionNodeConfig = (nodeId:string) => {
  console.log('nodeId', nodeId);
  console.log("proxy.$refs", proxy.$refs);
  // TODO 测试后续去掉
  const conditionNode = proxy.$refs[nodeId][0];
  console.log("node inf is ", conditionNode.nodeInfo);
  conditionNode.open()
}

const addCondition = () => {
  const conditionNodes =  currentNode.value.conditionNodes;
  if (conditionNodes) {
    const len = conditionNodes.length
    let lastIndex = len - 1
    const conditionData: SimpleFlowNode = {
      id:  generateUUID(),
      name: '条件'+len,
      showText : '',
      type: NodeType.CONDITION_NODE,
      childNode: undefined,
      conditionNodes: [],
      attributes: {
        conditionType: 1,
        defaultCondition: false
      }
    }
    conditionNodes.splice(lastIndex, 0, conditionData)
  }
}

const deleteCondition = (index:number) => {
  const conditionNodes =  currentNode.value.conditionNodes;
  if (conditionNodes) {
    conditionNodes.splice(index, 1)
    if (conditionNodes.length == 1) {
      const childNode = currentNode.value.childNode
      // 更新此节点为后续孩子节点
      emits('update:modelValue', childNode)
    }
  }
}

</script>

<style lang="scss" scoped></style>
