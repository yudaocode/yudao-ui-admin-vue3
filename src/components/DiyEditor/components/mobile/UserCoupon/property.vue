<template>
  <ComponentContainerProperty v-model="formData.style" />
</template>

<script setup lang="ts">
import { UserCouponProperty } from './config'
import { useVModel } from '@vueuse/core'

// 用户卡券属性面板
defineOptions({ name: 'UserCouponProperty' })

const props = defineProps<{ modelValue: UserCouponProperty }>()
const emit = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emit)
</script>

<style scoped lang="scss"></style>
