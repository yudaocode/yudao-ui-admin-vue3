<template>
  <el-row :gutter="10">
    <el-col :span="8">
      <ContentWrap>
        <KeFuConversationBox ref="keFuConversationRef" @change="handleChange" />
      </ContentWrap>
    </el-col>
    <el-col :span="16">
      <ContentWrap>
        <KeFuChatBox ref="keFuChatBoxRef" />
      </ContentWrap>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { KeFuChatBox, KeFuConversationBox } from './components'
import { KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'

defineOptions({ name: 'KeFu' })

// 加载消息
const keFuChatBoxRef = ref<InstanceType<typeof KeFuChatBox>>()
const handleChange = (conversation: KeFuConversationRespVO) => {
  keFuChatBoxRef.value?.getMessageList(conversation)
}

// 加载会话
const keFuConversationRef = ref<InstanceType<typeof KeFuConversationBox>>()
onMounted(() => {
  keFuConversationRef.value?.getConversationList()
})
</script>

<style lang="scss">
.kefu {
  height: calc(100vh - 165px);
  overflow: auto; /* 确保内容可滚动 */
}

/* 定义滚动条样式 */
::-webkit-scrollbar {
  width: 10px;
  height: 6px;
}

/*定义滚动条轨道 内阴影+圆角*/
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 0px rgba(240, 240, 240, 0.5);
  border-radius: 10px;
  background-color: #fff;
}

/*定义滑块 内阴影+圆角*/
::-webkit-scrollbar-thumb {
  border-radius: 10px;
  box-shadow: inset 0 0 0px rgba(240, 240, 240, 0.5);
  background-color: rgba(240, 240, 240, 0.5);
}
</style>
