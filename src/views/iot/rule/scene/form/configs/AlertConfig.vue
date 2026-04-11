<!-- 告警配置组件 -->
<template>
  <div class="w-full">
    <el-form-item label="告警配置" required>
      <el-select
        v-model="localValue"
        placeholder="请选择告警配置"
        filterable
        clearable
        @change="handleChange"
        class="w-full"
        :loading="loading"
      >
        <el-option
          v-for="config in alertConfigs"
          :key="config.id"
          :label="config.name"
          :value="config.id"
        >
          <div class="flex items-center justify-between">
            <span>{{ config.name }}</span>
            <el-tag :type="config.enabled ? 'success' : 'danger'" size="small">
              {{ config.enabled ? '启用' : '禁用' }}
            </el-tag>
          </div>
        </el-option>
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { AlertConfigApi } from '@/api/iot/alert/config'

/** 告警配置组件 */
defineOptions({ name: 'AlertConfig' })

const props = defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value?: number): void
}>()

const localValue = useVModel(props, 'modelValue', emit)

const loading = ref(false) // 加载状态
const alertConfigs = ref<any[]>([]) // 告警配置列表

/**
 * 处理选择变化事件
 * @param value 选中的值
 */
const handleChange = (value?: number) => {
  emit('update:modelValue', value)
}

/**
 * 加载告警配置列表
 */
const loadAlertConfigs = async () => {
  loading.value = true
  try {
    const data = await AlertConfigApi.getAlertConfigPage({
      pageNo: 1,
      pageSize: 100,
      enabled: true // 只加载启用的配置
    })
    alertConfigs.value = data.list || []
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadAlertConfigs()
})
</script>
