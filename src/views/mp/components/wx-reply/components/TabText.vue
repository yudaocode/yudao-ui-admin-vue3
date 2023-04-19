<template>
  <el-tab-pane name="text">
    <template #label>
      <el-row align="middle"><Icon icon="ep:document" /> 文本</el-row>
    </template>
    <el-input type="textarea" :rows="5" placeholder="请输入内容" v-model="content" />
  </el-tab-pane>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null)
  (e: 'input', v: string | null)
}>()

const content = computed<string | null>({
  get: () => props.modelValue,
  set: (val: string | null) => {
    emit('update:modelValue', val)
    emit('input', val)
  }
})
</script>
