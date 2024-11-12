<template>
  <view
    class="flex w-full"
    :class="props.message.role === MessageRole.SELF ? 'flex-row-reverse' : 'flex-row'"
  >
    <el-avatar shape="square" size="default" class="mx-2" :src="props.message.avatar" />
    <view class="flex flex-col" :class="props.message.role === MessageRole.SELF ? 'items-end' : 'items-start'">
      <label class="text-xs text-gray-4 mb-1">{{ props.message.nickname }}</label>
      <view class="flex items-center">
        <el-icon v-if="props.message.sendStatus === SendStatus.SENDING" class="is-loading"
          ><Loading
        /></el-icon>
        <slot name="content"></slot>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { MessageModelType, MessageRole, SendStatus } from '../../types/types'

defineOptions({ name: 'BaseMessage' })

const props = defineProps({
  message: {
    type: Object as PropType<MessageModelType>,
    default: () => {}
  }
})
</script>
