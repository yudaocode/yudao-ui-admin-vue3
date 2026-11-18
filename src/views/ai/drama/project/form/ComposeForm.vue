<!-- AI 短剧：合成成片弹窗，画布中使用；合成设置与分镜工作台的成片条共用 -->
<template>
  <Dialog v-model="dialogVisible" title="合成成片" width="720px">
    <ComposePanel
      ref="panelRef"
      :detail="detail"
      @success="handleSuccess"
      @refresh="emit('success')"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import ComposePanel from './storyboard/ComposePanel.vue'

/** AI 短剧：合成成片 */
defineOptions({ name: 'AiDramaComposeForm' })

defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ success: [] }>()

const dialogVisible = ref(false)
const panelRef = ref()

/** 打开：storyboardIds 为画布中视频节点的顺序，为空时按镜头顺序 */
const open = async (storyboardIds?: number[]) => {
  dialogVisible.value = true
  await nextTick()
  panelRef.value.reset(storyboardIds)
}
defineExpose({ open })

/** 已提交合成：关闭弹窗 */
const handleSuccess = () => {
  dialogVisible.value = false
  emit('success')
}
</script>
