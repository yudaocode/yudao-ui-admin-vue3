<template>
  <el-container class="kefu">
    <el-header>
      <div class="kefu-title">芋道</div>
    </el-header>
    <el-main class="kefu-content">
      <div
        v-for="item in 100"
        :key="item"
        :class="[item % 2 === 0 ? `ss-row-left` : `ss-row-right`]"
        class="flex mb-20px w-[100%]"
      >
        <el-avatar
          v-if="item % 2 === 0"
          alt="avatar"
          src="https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg"
        />
        <div class="ml-10px"> Lorem Ipsum，也称乱数假文或者哑元文本</div>
        <el-avatar
          v-if="item % 2 !== 0"
          alt="avatar"
          src="https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg"
        />
      </div>
    </el-main>
    <el-footer height="230px">
      <div class="h-[100%]">
        <div class="chat-tools">
          <Icon :size="30" class="ml-10px" icon="fa:frown-o" />
        </div>
        <el-input v-model="message" :autosize="{ minRows: 6, maxRows: 6 }" type="textarea" />
        <div class="h-45px flex justify-end">
          <el-button class="mt-10px" type="primary">发送</el-button>
        </div>
      </div>
    </el-footer>
  </el-container>
  <!-- 没选择左侧会话时显示空界面 -->
</template>

<script lang="ts" setup>
defineOptions({ name: 'KeFuMessageBox' })
const message = ref('')
</script>

<style lang="scss" scoped>
.kefu {
  &-title {
    border-bottom: #e4e0e0 solid 1px;
    height: 60px;
    line-height: 60px;
  }

  &-content {
  }

  .chat-tools {
    width: 100%;
    border: #e4e0e0 solid 1px;
    height: 44px;
    display: flex;
    align-items: center;
  }

  .ss-row-left {
    justify-content: flex-start;
  }

  .ss-row-right {
    justify-content: flex-end;
  }

  ::v-deep(textarea) {
    resize: none;
  }
}
</style>
