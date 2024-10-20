<template>
  <BaseMesageLayout :message="props.message">
    <template #content>
      <view class="p-3 bg-gray-2 rounded">
        <label>{{ props.message.content }}</label>
      </view>
    </template>
  </BaseMesageLayout>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import BaseMesageLayout from './BaseMsg.vue'
import TextMessage from '../../model/TextMessage'

defineOptions({ name: 'TextMessage' })

const props = defineProps({
  message: {
    type: Object as PropType<TextMessage>,
    default: () => {}
  }
})
</script>
