<script lang="ts" setup>
defineOptions({ name: 'Tooltip' })

defineProps({
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  icon: { type: String, default: 'ep:question-filled' }
})
</script>
<template>
  <span>{{ title }}</span>
  <ElTooltip :content="message" placement="top">
    <Icon :icon="icon" class="relative top-1px ml-1px" />
  </ElTooltip>
</template>
