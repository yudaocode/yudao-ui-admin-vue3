<!-- message 新增对话 -->
<template>
  <div class="new-chat">
    <div class="box-center">
      <div class="tip">点击下方按钮，开始你的对话吧</div>
      <div class="btns">
        <el-button type="primary" round @click="handlerNewChat">新建对话</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义钩子
const emits = defineEmits(['onNewChat'])

/**
 * 新建 chat
 */
const handlerNewChat = async () => {
  await emits('onNewChat')
}
</script>
<style scoped lang="scss">
.new-chat {
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
  height: 100%;

  .box-center {
    display: flex;
    flex-direction: column;
    justify-content: center;

    .tip {
      font-size: 14px;
      color: #858585;
    }

    .btns {
      display: flex;
      flex-direction: row;
      justify-content: center;
      margin-top: 20px;
    }
  }
}
</style>
