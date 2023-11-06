<template>
  <el-button-group v-bind="$attrs">
    <slot></slot>
  </el-button-group>
</template>

<script setup lang="ts">
/**
 * 垂直按钮组
 * Element官方的按钮组只支持水平显示，通过重写样式实现垂直布局
 */
defineOptions({ name: 'VerticalButtonGroup' })
</script>

<style scoped lang="scss">
.el-button-group {
  display: inline-flex;
  flex-direction: column;
}
.el-button-group > :deep(.el-button:first-child) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-top-right-radius: var(--el-border-radius-base);
  border-bottom-color: var(--el-button-divide-border-color);
}
.el-button-group > :deep(.el-button:last-child) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: var(--el-border-radius-base);
  border-top-color: var(--el-button-divide-border-color);
}
.el-button-group :deep(.el-button--primary:not(:first-child):not(:last-child)) {
  border-top-color: var(--el-button-divide-border-color);
  border-bottom-color: var(--el-button-divide-border-color);
}
.el-button-group > :deep(.el-button:not(:last-child)) {
  margin-bottom: -1px;
  margin-right: 0;
}
</style>
