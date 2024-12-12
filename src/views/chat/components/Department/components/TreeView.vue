<template>
  <div class="tree">
    <TreeNode v-for="item in hierarchy" :key="item.id" :node="item"   @node-click="$emit('tree-click', $event)"/>
  </div>
</template>

<script setup>
import TreeNode from './TreeNode.vue';

// 传递 `hierarchy` 数据作为组件属性
defineProps({
  hierarchy: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['tree-click'])

</script>

<style scoped>
.tree {
  font-family: Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}
</style>
