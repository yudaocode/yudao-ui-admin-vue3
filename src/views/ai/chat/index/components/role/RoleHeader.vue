<!-- header -->
<template>
  <el-header class="chat-header">
    <div class="title">
      {{ title }}
    </div>
    <div class="title-right">
      <slot></slot>
    </div>
  </el-header>
</template>

<script setup lang="ts">
// 设置组件属性
defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>

<style scoped lang="scss">
.chat-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
  background-color: #ececec;
  width: 100%;

  .title {
    font-size: 20px;
    font-weight: bold;
    overflow: hidden;
    color: #3e3e3e;
    max-width: 220px;
  }

  .title-right {
    display: flex;
    flex-direction: row;
  }
}
</style>
