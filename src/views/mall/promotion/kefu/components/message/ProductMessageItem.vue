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
      <ProductItem
        :picUrl="getMessageContent.picUrl"
        :price="getMessageContent.price"
        :skuText="getMessageContent.introduction"
        :title="getMessageContent.spuName"
        :titleWidth="400"
        priceColor="#FF3000"
      />
    </div>
  </template>
</template>

<script lang="ts" setup>
import { KeFuMessageContentTypeEnum } from '../tools/constants'
import ProductItem from './ProductItem.vue'
import { UserTypeEnum } from '@/utils/constants'
import { KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'

defineOptions({ name: 'ProductMessageItem' })
const props = defineProps<{
  message: KeFuMessageRespVO
}>()

/** 获悉消息内容 */
const getMessageContent = computed(() => JSON.parse(props.message.content))
</script>
