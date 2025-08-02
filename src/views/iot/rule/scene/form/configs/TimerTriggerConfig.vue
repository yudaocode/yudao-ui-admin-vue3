<template>
  <div class="flex flex-col gap-16px">
    <div
      class="flex items-center gap-8px p-12px px-16px bg-[var(--el-fill-color-light)] rounded-6px border border-[var(--el-border-color-lighter)]"
    >
      <Icon icon="ep:timer" class="text-[var(--el-color-danger)] text-18px" />
      <span class="text-14px font-500 text-[var(--el-text-color-primary)]">定时触发配置</span>
    </div>

    <!-- CRON 表达式配置 -->
    <div
      class="p-16px border border-[var(--el-border-color-lighter)] rounded-6px bg-[var(--el-fill-color-blank)]"
    >
      <el-form-item label="CRON表达式" required>
        <Crontab v-model="localValue" />
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { Crontab } from '@/components/Crontab'

/** 定时触发配置组件 */
defineOptions({ name: 'TimerTriggerConfig' })

const props = defineProps<{
  modelValue?: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}>()

const localValue = useVModel(props, 'modelValue', emit, {
  defaultValue: '0 0 12 * * ?'
})
</script>
