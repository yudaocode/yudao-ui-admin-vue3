<template>
  <ContentWrap :bodyStyle="{ padding: '20px 16px' }">
    <SimpleProcessDesigner
      :model-id="modelId"
      :model-key="modelKey"
      :model-name="modelName"
      @success="handleSuccess"
      :start-user-ids="startUserIds"
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

// 修改成功回调
const handleSuccess = (data?: any) => {
  console.info('handleSuccess', data)
  if (data) {
    emit('success', data)
  }
}

// 组件创建时初始化数据
onMounted(() => {
})

// 组件卸载前保存数据
onBeforeUnmount(async () => {

})

defineExpose({
})
</script>
<style lang="scss" scoped></style>
