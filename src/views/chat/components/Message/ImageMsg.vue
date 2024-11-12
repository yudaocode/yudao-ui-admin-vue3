<template>
  <BaseMesageLayout>
    <template #content>
      <view>
        <label>{{ props.message.content }}</label>
      </view>
    </template>
  </BaseMesageLayout>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { useChatStore } from '../../store/chatstore'
import { onMounted } from 'vue'
import { MessageModelType } from '../../types/types'
import BaseMesageLayout from './BaseMsg.vue'

defineOptions({ name: 'ImageMessage' })

const props = defineProps({
  message: {
    type: Object as PropType<MessageModelType>,
    default: () => {}
  }
})

const { sessionList, setCurrentConversation, setCurrentSessionIndex } = useChatStore()
</script>
