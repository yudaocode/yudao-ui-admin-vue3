<template>
  <ComponentContainerProperty v-model="formData.style" />
</template>

<script setup lang="ts">
import { UserCouponProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'

// 用户卡券属性面板
defineOptions({ name: 'UserCouponProperty' })

const props = defineProps<{ modelValue: UserCouponProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
</script>

<style scoped lang="scss"></style>
