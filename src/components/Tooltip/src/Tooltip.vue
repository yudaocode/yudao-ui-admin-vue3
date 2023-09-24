<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'Tooltip' })

defineProps({
  titel: propTypes.string.def(''),
  message: propTypes.string.def(''),
  icon: propTypes.string.def('ep:question-filled')
})
</script>
<template>
  <span>{{ titel }}</span>
  <ElTooltip :content="message" placement="top">
    <Icon :icon="icon" class="relative top-1px ml-1px" />
  </ElTooltip>
</template>
