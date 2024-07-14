<template>
  <!-- 图片消息 -->
  <template v-if="KeFuMessageContentTypeEnum.IMAGE === message.contentType">
    <div
      :class="[
        message.senderType === UserTypeEnum.MEMBER
          ? `ml-10px`
          : message.senderType === UserTypeEnum.ADMIN
            ? `mr-10px`
            : ''
      ]"
    >
      <el-image
        :initial-index="0"
        :preview-src-list="[message.content]"
        :src="message.content"
        class="w-200px"
        fit="contain"
        preview-teleported
      />
    </div>
  </template>
</template>

<script lang="ts" setup>
import { KeFuMessageContentTypeEnum } from '../tools/constants'
import { UserTypeEnum } from '@/utils/constants'
import { KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'

defineOptions({ name: 'ImageMessageItem' })
defineProps<{
  message: KeFuMessageRespVO
}>()
</script>
