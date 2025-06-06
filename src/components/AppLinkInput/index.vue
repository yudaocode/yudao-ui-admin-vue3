<template>
  <el-input v-model="appLink" placeholder="输入或选择链接">
    <template #append>
      <el-button @click="handleOpenDialog">选择</el-button>
    </template>
  </el-input>
  <AppLinkSelectDialog ref="dialogRef" @change="handleLinkSelected" />
</template>
<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'

// APP 链接输入框
defineOptions({ name: 'AppLinkInput' })
// 定义属性
const props = defineProps({
  // 当前选中的链接
  modelValue: propTypes.string.def('')
})
// 当前的链接
const appLink = ref('')
// 选择对话框
const dialogRef = ref()
// 处理打开对话框
const handleOpenDialog = () => dialogRef.value?.open(appLink.value)
// 处理 APP 链接选中
const handleLinkSelected = (link: string) => (appLink.value = link)

// getter
watch(
  () => props.modelValue,
  () => (appLink.value = props.modelValue),
  { immediate: true }
)

// setter
const emit = defineEmits<{
  'update:modelValue': [link: string]
}>()
watch(
  () => appLink.value,
  () => emit('update:modelValue', appLink.value)
)
</script>
