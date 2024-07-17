<template>
  <!-- 消息组件 -->
  <template v-if="contentType === message.contentType">
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
</template>

<script lang="ts" setup>
import { UserTypeEnum } from '@/utils/constants'
import { KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'

defineOptions({ name: 'MessageItem' })
defineProps<{
  message: KeFuMessageRespVO
  contentType: number
}>()
</script>
