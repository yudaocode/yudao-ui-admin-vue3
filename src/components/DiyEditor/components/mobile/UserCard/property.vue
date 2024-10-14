<template>
  <ComponentContainerProperty v-model="formData.style" />
</template>

<script setup lang="ts">
import { UserCardProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'

// 用户卡片属性面板
defineOptions({ name: 'UserCardProperty' })

const props = defineProps<{ modelValue: UserCardProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
</script>

<style scoped lang="scss"></style>
