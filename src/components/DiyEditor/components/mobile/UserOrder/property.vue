<template>
  <ComponentContainerProperty v-model="formData.style" />
</template>

<script setup lang="ts">
import { UserOrderProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'

// 用户订单属性面板
defineOptions({ name: 'UserOrderProperty' })

const props = defineProps<{ modelValue: UserOrderProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
</script>

<style scoped lang="scss"></style>
