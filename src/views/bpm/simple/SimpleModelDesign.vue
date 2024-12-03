<template>
  <ContentWrap :bodyStyle="{ padding: '20px 16px' }">
    <SimpleProcessDesigner :model-id="modelId" @success="handleSuccess" />
  </ContentWrap>
</template>
<script setup lang="ts">
import { SimpleProcessDesigner } from '@/components/SimpleProcessDesignerV2/src/'

defineOptions({
  name: 'SimpleModelDesign'
})

defineProps<{
  modelId: string
}>()

const emit = defineEmits(['success'])

// 修改成功回调
const handleSuccess = () => {
  emit('success')
}
</script>
<style lang="scss" scoped></style>
