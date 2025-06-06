<!-- 标签选项 -->
<template>
  <div class="flex flex-wrap gap-[8px]">
    <span
      v-for="tag in props.tags"
      :key="tag.value"
      class="tag mb-2 border-[2px] border-solid border-[#DDDFE3] px-2 leading-6 text-[12px] bg-[#DDDFE3] rounded-[4px] cursor-pointer"
      :class="modelValue === tag.value && '!border-[#846af7] text-[#846af7]'"
      @click="emits('update:modelValue', tag.value)"
    >
      {{ tag.label }}
    </span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tags: { label: string; value: string }[]
    modelValue: string
    [k: string]: any
  }>(),
  {
    tags: () => []
  }
)

const emits = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>
<style scoped></style>
