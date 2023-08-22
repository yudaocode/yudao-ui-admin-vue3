<script lang="ts" setup>
import { defineComponent } from 'vue'
defineComponent({
  name: 'CardTitle'
})
const { title } = defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>

<template>
  <span class="card-title">{{ title }}</span>
</template>

<style scoped lang="scss">
.card-title {
  font-size: 14px;
  font-weight: 600;
  &::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 14px;
    //background-color: #105cfb;
    background: var(--el-color-primary);
    position: relative;
    left: -5px;
    top: 8px;
    border-radius: 5px;
    transform: translateY(-50%);
  }
}
</style>
