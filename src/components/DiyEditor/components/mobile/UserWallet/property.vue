<template>
  <ComponentContainerProperty v-model="formData.style" />
</template>

<script setup lang="ts">
import { UserWalletProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'

// 用户资产属性面板
defineOptions({ name: 'UserWalletProperty' })

const props = defineProps<{ modelValue: UserWalletProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
</script>

<style scoped lang="scss"></style>
