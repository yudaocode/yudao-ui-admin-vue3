<template>
  <div class="flex flex-col">
    <div class="flex items-center justify-between p-x-18px p-y-24px">
      <div class="flex flex-1 items-center gap-16px">
        <el-avatar :size="60">
          <Icon icon="ep:avatar" :size="60" />
        </el-avatar>
        <span class="text-18px font-bold">芋道源码</span>
      </div>
      <Icon icon="tdesign:qrcode" :size="20" />
    </div>
    <div
      class="flex items-center justify-between justify-between bg-white p-x-20px p-y-8px text-12px"
    >
      <span class="color-#ff690d">点击绑定手机号</span>
      <span class="rounded-26px bg-#ff6100 p-x-8px p-y-5px color-white">去绑定</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { UserCardProperty } from './config'

/** 用户卡片 */
defineOptions({ name: 'UserCard' })
// 定义属性
defineProps<{ property: UserCardProperty }>()
</script>

<style scoped lang="scss"></style>
