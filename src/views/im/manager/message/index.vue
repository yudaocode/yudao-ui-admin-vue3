<template>
  <ContentWrap>
    <!-- TODO @芋艿：这个只是临时的 -->
    <div class="im-manager-placeholder">我是消息管理测试界面</div>
  </ContentWrap>
</template>

<script lang="ts" setup>
defineOptions({ name: 'ImManagerMessage' })
</script>

<style scoped>
.im-manager-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 18px;
  color: #606266;
}
</style>
