<template>
  <!-- 图片消息 -->
  <template v-if="KeFuMessageContentTypeEnum.PRODUCT === message.contentType">
    <div
      :class="[
        message.senderType === UserTypeEnum.MEMBER
          ? `ml-10px`
          : message.senderType === UserTypeEnum.ADMIN
            ? `mr-10px`
            : ''
      ]"
    >
      <div class="goods flex items-center">
        <el-image
          :src="getMessageContent.picUrl"
          class="image"
          fit="contain"
          @click="imagePreview(getMessageContent.picUrl)"
        />
        <view class="flex-1">
          <view class="title ss-line-2">
            {{ getMessageContent.spuName }}
          </view>
          <view v-if="getMessageContent.introduction" class="subtitle ss-line-1">
            {{ getMessageContent.introduction }}
          </view>
          <view class="price mt-8px"> ￥{{ getMessageContent.price }}</view>
        </view>
      </div>
    </div>
  </template>
</template>

<script lang="ts" setup>
import { KeFuMessageContentTypeEnum } from '../tools/constants'
import { UserTypeEnum } from '@/utils/constants'
import { KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'
import { createImageViewer } from '@/components/ImageViewer'

defineOptions({ name: 'ImageMessageItem' })
const props = defineProps<{
  message: KeFuMessageRespVO
}>()
const getMessageContent = computed(() => JSON.parse(props.message.content))
/** 图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}
</script>
<style lang="scss" scoped>
.goods {
  padding: 20px;
  border-radius: 12px;
  background-color: #e1e1e1;

  .ss-line {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;

    &-1 {
      -webkit-line-clamp: 1;
    }

    &-2 {
      -webkit-line-clamp: 2;
    }
  }

  .image {
    width: 116px;
    height: 116px;
    flex-shrink: 0;
    margin-right: 20px;
  }

  .title {
    height: 64px;
    line-height: 32px;
    font-size: 26px;
    font-weight: 500;
    color: #333;
  }

  .subtitle {
    font-size: 24px;
    font-weight: 400;
    color: #999;
  }

  .price {
    font-size: 26px;
    font-weight: 500;
    color: #ff3000;
  }
}
</style>
