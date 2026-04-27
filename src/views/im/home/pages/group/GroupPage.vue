<template>
  <!-- 群聊 Tab 占位页，对齐 boxim /home/group；后续接入我的群、创建群、群管理等功能 -->
  <div class="im-placeholder-page">
    <el-empty description="群聊功能敬请期待" :image-size="120" />
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'ImGroupPage' })
</script>

<style scoped>
.im-placeholder-page {
  display: flex;
  flex: 1;
  min-width: 0;
  height: 100%;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}
</style>
