<!-- 无聊天对话时，在 message 区域，可以新增对话 -->
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
const emits = defineEmits(['onNewConversation'])

/** 新建 conversation 聊天对话 */
const handlerNewChat = () => {
  emits('onNewConversation')
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
