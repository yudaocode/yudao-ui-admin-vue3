<!-- 告警配置组件 -->
<template>
  <el-form
    ref="innerFormRef"
    :model="formModel"
    :rules="formRules"
    label-width="110px"
    class="w-full"
  >
    <el-form-item label="告警配置" prop="alertConfigId" required>
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
  </el-form>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { useVModel } from '@vueuse/core'
import { AlertConfigApi } from '@/api/iot/alert/config'
import { buildAlertConfigRules } from '@/views/iot/utils/sceneRule'

/** 告警配置组件 */
defineOptions({ name: 'AlertConfig' })

const props = defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value?: number): void
}>()

const localValue = useVModel(props, 'modelValue', emit)
const innerFormRef = ref<FormInstance>()
const formRules = buildAlertConfigRules()

const formModel = computed(() => ({
  alertConfigId: localValue.value
}))

const loading = ref(false)
const alertConfigs = ref<any[]>([])

/**
 * 处理选择变化事件
 * @param value 选中的值
 */
const handleChange = (value?: number) => {
  emit('update:modelValue', value)
  nextTick(() => {
    innerFormRef.value?.validateField('alertConfigId').catch(() => {})
  })
}

/** 加载告警配置列表 */
const loadAlertConfigs = async () => {
  loading.value = true
  try {
    const data = await AlertConfigApi.getAlertConfigPage({
      pageNo: 1,
      pageSize: 100,
      enabled: true
    })
    alertConfigs.value = data.list || []
  } finally {
    loading.value = false
  }
}

const validate = async (): Promise<boolean> => {
  if (!innerFormRef.value) {
    return true
  }
  try {
    await innerFormRef.value.validate()
    return true
  } catch {
    return false
  }
}

const clearValidate = () => {
  innerFormRef.value?.clearValidate()
}

defineExpose({ validate, clearValidate })

onMounted(() => {
  loadAlertConfigs()
})
</script>
