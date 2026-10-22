<template>
  <Dialog title="长期记忆详情" v-model="dialogVisible" width="800px">
    <el-descriptions :column="2" :label-width="120" border>
      <el-descriptions-item label="Agent">
        {{ memory?.agentName || memory?.agentId }}
      </el-descriptions-item>
      <el-descriptions-item label="用户">
        {{ memory?.userNickname || memory?.userId }}
      </el-descriptions-item>
      <el-descriptions-item label="已归档消息编号">
        {{ memory?.lastMessageId }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ formatDate(memory?.updateTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-divider content-position="left">记忆内容</el-divider>
    <MarkdownView v-if="memory?.content" :content="memory.content" />
    <el-empty v-else description="暂无记忆内容" :image-size="60" />
  </Dialog>
</template>
<script setup lang="ts">
import { formatDate } from '@/utils/formatTime'
import { Memory } from '@/api/ai1/memory'
import MarkdownView from '@/components/MarkdownView/index.vue'

/** AI1 长期记忆详情弹窗 */
defineOptions({ name: 'Ai1MemoryDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const memory = ref<Memory>() // 当前记忆

/** 打开弹窗 */
const open = (row: Memory) => {
  dialogVisible.value = true
  memory.value = row
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
