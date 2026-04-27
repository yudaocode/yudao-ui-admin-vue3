<template>
  <!-- 好友 Tab 占位页，对齐 boxim /home/friend；后续接入好友申请、分组、黑名单等功能 -->
  <div class="im-placeholder-page">
    <el-empty description="好友功能敬请期待" :image-size="120" />
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'ImFriendPage' })
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
