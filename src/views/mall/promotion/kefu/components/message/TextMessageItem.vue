<template>
  <!-- 文本消息 -->
  <template v-if="KeFuMessageContentTypeEnum.TEXT === message.contentType">
    <div
      v-dompurify-html="replaceEmoji(message.content)"
      :class="[
        message.senderType === UserTypeEnum.MEMBER
          ? `ml-10px`
          : message.senderType === UserTypeEnum.ADMIN
            ? `mr-10px`
            : ''
      ]"
      class="flex items-center"
    ></div>
  </template>
</template>

<script lang="ts" setup>
import { KeFuMessageContentTypeEnum } from '../tools/constants'
import { UserTypeEnum } from '@/utils/constants'
import { useEmoji } from '../tools/emoji'
import { KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'

defineOptions({ name: 'TextMessageItem' })
defineProps<{
  message: KeFuMessageRespVO
}>()
const { replaceEmoji } = useEmoji()
</script>
