<template>
  <div class="start-node-wrapper">
    <div class="start-node-container">
      <div class="start-node-box">
        <Icon icon="ep:avatar" />
        <span class="node-fixed-name" :title="currentNode.name">{{currentNode.name}}</span>
        <Icon icon="ep:arrow-right-bold" />
      </div>
      <!-- 传递子节点给添加节点组件。会在子节点后面添加节点 -->
      <node-handler v-if="currentNode" v-model:child-node="currentNode.childNode" />
    </div>
  </div>
</template>
<script setup lang="ts">
import NodeHandler from '../NodeHandler.vue'
import { SimpleFlowNode }  from '../consts';
defineOptions({
  name: 'StartEventNode'
})
const props = defineProps({
  flowNode : {
    type: Object as () => SimpleFlowNode,
    default: () => null
  }
});
const currentNode = ref<SimpleFlowNode>(props.flowNode);

watch(() => props.flowNode, (newValue) => {  
  console.log('start node value changed=================>', newValue);
  currentNode.value = newValue;  
}); 
</script>
<style lang="scss" scoped>

</style>
