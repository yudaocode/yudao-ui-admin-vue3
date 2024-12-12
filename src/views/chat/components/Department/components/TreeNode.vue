<template>
  <div class="tree-node" >
    <div class="node-title custom-hover" @click.stop="onClick">
      <ElAvatar class="m-2" shape="square" v-if="node.children.length > 0">{{ node.name.substring(0,1) }}</ElAvatar>
       <span class="mx-1 p-1">{{ node.name }}</span>
    </div>
    <div v-if="node.children && node.children.length > 0" class="children">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        @node-click="$emit('node-click', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import TreeNode from './TreeNode.vue';

// 传递 `node` 数据作为属性
const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['node-click'])

const onClick = () => {
  emit('node-click', props.node)
}

</script>

<style scoped>
.tree-node {
  padding-left: 8px;
  margin-left: 16px;
  border-left: 1px solid #ccc;
}

.node-title {
  margin: 4px 0;
  font-weight: 500;
  color: #333;
}

.children {
  margin-top: 4px;
}
</style>
