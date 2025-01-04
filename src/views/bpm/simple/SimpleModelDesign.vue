<template>
  <ContentWrap :bodyStyle="{ padding: '20px 16px' }">
    <SimpleProcessDesigner
      :model-id="modelId"
      :model-key="modelKey"
      :model-name="modelName"
      :value="currentValue"
      @success="handleSuccess"
      @init-finished="handleInit"
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
  value?: string
  startUserIds?: number[]
}>()

const emit = defineEmits(['success', 'init-finished'])
const designerRef = ref()
const isInitialized = ref(false)
const currentValue = ref('')

// 初始化或更新当前值
const initOrUpdateValue = async () => {
  console.log('initOrUpdateValue', props.value)
  if (props.value) {
    currentValue.value = props.value
    // 如果设计器已经初始化，立即加载数据
    if (isInitialized.value && designerRef.value) {
      try {
        await designerRef.value.loadProcessData(props.value)
        await nextTick()
        if (designerRef.value.refresh) {
          await designerRef.value.refresh()
        }
      } catch (error) {
        console.error('加载流程数据失败:', error)
      }
    }
  }
}

// 监听属性变化
watch(
  [() => props.modelKey, () => props.modelName, () => props.value],
  async ([newKey, newName, newValue], [oldKey, oldName, oldValue]) => {
    if (designerRef.value && isInitialized.value) {
      try {
        if (newKey && newName && (newKey !== oldKey || newName !== oldName)) {
          await designerRef.value.updateModel(newKey, newName)
        }
        if (newValue && newValue !== oldValue) {
          currentValue.value = newValue
          await designerRef.value.loadProcessData(newValue)
          await nextTick()
          if (designerRef.value.refresh) {
            await designerRef.value.refresh()
          }
        }
      } catch (error) {
        console.error('更新流程数据失败:', error)
      }
    }
  },
  { deep: true, immediate: true }
)

// 初始化完成回调
const handleInit = async () => {
  try {
    isInitialized.value = true
    emit('init-finished')

    // 等待下一个tick，确保设计器已经准备好
    await nextTick()

    // 初始化完成后，设置初始值
    if (props.modelKey && props.modelName) {
      await designerRef.value.updateModel(props.modelKey, props.modelName)
    }
    if (props.value) {
      currentValue.value = props.value
      await designerRef.value.loadProcessData(props.value)
      // 再次刷新确保数据正确加载
      await nextTick()
      if (designerRef.value.refresh) {
        await designerRef.value.refresh()
      }
    }
  } catch (error) {
    console.error('初始化流程数据失败:', error)
  }
}

// 修改成功回调
const handleSuccess = (data?: any) => {
  console.warn('handleSuccess', data)
  if (data && data !== currentValue.value) {
    currentValue.value = data
    emit('success', data)
  }
}

/** 获取当前流程数据 */
const getCurrentFlowData = async () => {
  try {
    if (designerRef.value) {
      const data = await designerRef.value.getCurrentFlowData()
      if (data) {
        currentValue.value = data
      }
      return data
    }
    return currentValue.value || undefined
  } catch (error) {
    console.error('获取流程数据失败:', error)
    return currentValue.value || undefined
  }
}

// 组件创建时初始化数据
onMounted(() => {
  initOrUpdateValue()
})

// 组件卸载前保存数据
onBeforeUnmount(async () => {
  try {
    const data = await getCurrentFlowData()
    if (data) {
      emit('success', data)
    }
  } catch (error) {
    console.error('保存数据失败:', error)
  }
})

defineExpose({
  getCurrentFlowData,
  refresh: () => designerRef.value?.refresh?.()
})
</script>
<style lang="scss" scoped></style>
