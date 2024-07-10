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
      <!-- TODO @puhui999：unocss -->
      <el-image
        :src="message.content"
        fit="contain"
        style="width: 200px"
        @click="imagePreview(message.content)"
      />
    </div>
  </template>
</template>

<script lang="ts" setup>
import { KeFuMessageContentTypeEnum } from '../tools/constants'
import { UserTypeEnum } from '@/utils/constants'
import { KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'
import { createImageViewer } from '@/components/ImageViewer'

defineOptions({ name: 'ImageMessageItem' })
defineProps<{
  message: KeFuMessageRespVO
}>()

/** 图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}
</script>
