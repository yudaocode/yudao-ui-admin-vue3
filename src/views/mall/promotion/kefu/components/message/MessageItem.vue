<template>
  <!-- 消息组件 -->
  <div
    :class="[
      message.senderType === UserTypeEnum.MEMBER
        ? `ml-10px`
        : message.senderType === UserTypeEnum.ADMIN
          ? `mr-10px`
          : ''
    ]"
  >
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { UserTypeEnum } from '@/utils/constants'
import { KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'

defineOptions({ name: 'MessageItem' })
defineProps<{
  message: KeFuMessageRespVO
}>()
</script>
