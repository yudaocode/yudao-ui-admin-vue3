<template>
  <ContentWrap :bodyStyle="{ padding: '20px 16px' }">
    <SimpleProcessDesigner 
      :model-id="modelId" 
      :model-key="modelKey"
      :model-name="modelName"
      :start-user-ids="startUserIds"
      @success="handleSuccess" 
      ref="designerRef"
    />
  </ContentWrap>
</template>
<script setup lang="ts">
import { SimpleProcessDesigner } from '@/components/SimpleProcessDesignerV2/src/'

defineOptions({
  name: 'SimpleModelDesign'
})

const props = defineProps<{
  modelId?: string
  modelKey?: string
  modelName?: string
  startUserIds?: number[]
}>()

const emit = defineEmits(['success'])
const designerRef = ref()

// 监听属性变化
watch([() => props.modelKey, () => props.modelName], ([newKey, newName]) => {
  if (designerRef.value && newKey && newName) {
    designerRef.value.updateModel(newKey, newName)
  }
}, { immediate: true, deep: true })

// 修改成功回调
const handleSuccess = (data?: any) => {
  emit('success', data)
}

/** 获取当前流程数据 */
const getCurrentFlowData = async () => {
  try {
    if (designerRef.value) {
      return await designerRef.value.getCurrentFlowData()
    }
    return undefined
  } catch (error) {
    console.error('获取流程数据失败:', error)
    return undefined
  }
}

defineExpose({
  getCurrentFlowData
})
</script>
<style lang="scss" scoped></style>
