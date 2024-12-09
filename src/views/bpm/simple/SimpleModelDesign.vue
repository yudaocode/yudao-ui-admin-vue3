<template>
  <ContentWrap :bodyStyle="{ padding: '20px 16px' }">
    <SimpleProcessDesigner 
      :model-id="modelId" 
      :model-key="modelKey"
      :model-name="modelName"
      @success="handleSuccess" 
    />
  </ContentWrap>
</template>
<script setup lang="ts">
import { SimpleProcessDesigner } from '@/components/SimpleProcessDesignerV2/src/'

defineOptions({
  name: 'SimpleModelDesign'
})

defineProps<{
  modelId?: string
  modelKey?: string
  modelName?: string
}>()

const emit = defineEmits(['success'])

// 修改成功回调
const handleSuccess = (data?: any) => {
  emit('success', data)
}
</script>
<style lang="scss" scoped></style>
