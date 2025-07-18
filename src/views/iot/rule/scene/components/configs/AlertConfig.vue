<!-- 告警配置组件 -->
<template>
  <div class="alert-config">
    <!-- TODO @puhui999：触发告警时，不用选择配置哈； -->
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
          <div class="alert-option">
            <div class="option-content">
              <div class="option-name">{{ config.name }}</div>
              <div class="option-desc">{{ config.description }}</div>
            </div>
            <el-tag :type="config.enabled ? 'success' : 'danger'" size="small">
              {{ config.enabled ? '启用' : '禁用' }}
            </el-tag>
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <!-- 告警配置详情 -->
    <div v-if="selectedConfig" class="alert-details">
      <div class="details-header">
        <Icon icon="ep:bell" class="details-icon" />
        <span class="details-title">{{ selectedConfig.name }}</span>
        <el-tag :type="selectedConfig.enabled ? 'success' : 'danger'" size="small">
          {{ selectedConfig.enabled ? '启用' : '禁用' }}
        </el-tag>
      </div>
      <div class="details-content">
        <div class="detail-item">
          <span class="detail-label">描述：</span>
          <span class="detail-value">{{ selectedConfig.description }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">通知方式：</span>
          <span class="detail-value">{{ getNotifyTypeName(selectedConfig.notifyType) }}</span>
        </div>
        <div v-if="selectedConfig.receivers" class="detail-item">
          <span class="detail-label">接收人：</span>
          <span class="detail-value">{{ selectedConfig.receivers.join(', ') }}</span>
        </div>
      </div>
    </div>

    <!-- 验证结果 -->
    <div v-if="validationMessage" class="validation-result">
      <el-alert
        :title="validationMessage"
        :type="isValid ? 'success' : 'error'"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

/** 告警配置组件 */
defineOptions({ name: 'AlertConfig' })

interface Props {
  modelValue?: number
}

interface Emits {
  (e: 'update:modelValue', value?: number): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit)

// 状态
const loading = ref(false)
const alertConfigs = ref<any[]>([])
const validationMessage = ref('')
const isValid = ref(true)

// 计算属性
const selectedConfig = computed(() => {
  return alertConfigs.value.find((config) => config.id === localValue.value)
})

// 工具函数
const getNotifyTypeName = (type: number) => {
  const typeMap = {
    1: '邮件通知',
    2: '短信通知',
    3: '微信通知',
    4: '钉钉通知'
  }
  return typeMap[type] || '未知'
}

// 事件处理
const handleChange = () => {
  updateValidationResult()
}

const updateValidationResult = () => {
  if (!localValue.value) {
    isValid.value = false
    validationMessage.value = '请选择告警配置'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  const config = selectedConfig.value
  if (!config) {
    isValid.value = false
    validationMessage.value = '告警配置不存在'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  if (!config.enabled) {
    isValid.value = false
    validationMessage.value = '选择的告警配置已禁用'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  // 验证通过
  isValid.value = true
  validationMessage.value = '告警配置验证通过'
  emit('validate', { valid: true, message: validationMessage.value })
}

// API 调用
const getAlertConfigs = async () => {
  loading.value = true
  try {
    // 这里应该调用真实的API获取告警配置
    // 暂时使用模拟数据
    // TODO @puhui999：这里是模拟数据
    alertConfigs.value = [
      {
        id: 1,
        name: '设备异常告警',
        description: '设备状态异常时发送告警',
        enabled: true,
        notifyType: 1,
        receivers: ['admin@example.com', 'operator@example.com']
      },
      {
        id: 2,
        name: '温度超限告警',
        description: '温度超过阈值时发送告警',
        enabled: true,
        notifyType: 2,
        receivers: ['13800138000', '13900139000']
      },
      {
        id: 3,
        name: '系统故障告警',
        description: '系统发生故障时发送告警',
        enabled: false,
        notifyType: 3,
        receivers: ['技术支持群']
      }
    ]
  } catch (error) {
    console.error('获取告警配置失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听值变化
watch(
  () => localValue.value,
  () => {
    updateValidationResult()
  }
)

// 初始化
onMounted(() => {
  getAlertConfigs()
  if (localValue.value) {
    updateValidationResult()
  }
})
</script>

<style scoped>
.alert-config {
  width: 100%;
}

.alert-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;
}

.option-content {
  flex: 1;
}

.option-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}

.option-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.alert-details {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.details-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.details-icon {
  color: var(--el-color-warning);
  font-size: 14px;
}

.details-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 22px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.detail-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 60px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  flex: 1;
}

.validation-result {
  margin-top: 8px;
}

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
