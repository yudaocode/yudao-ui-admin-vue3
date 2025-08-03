<!-- 告警配置组件 -->
<template>
  <div class="w-full">
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
          <div class="flex items-center justify-between w-full py-4px">
            <div class="flex-1">
              <div class="text-14px font-500 text-[var(--el-text-color-primary)] mb-2px">{{
                config.name
              }}</div>
              <div class="text-12px text-[var(--el-text-color-secondary)]">{{
                config.description
              }}</div>
            </div>
            <el-tag :type="config.enabled ? 'success' : 'danger'" size="small">
              {{ config.enabled ? '启用' : '禁用' }}
            </el-tag>
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <!-- 告警配置详情 -->
    <div
      v-if="selectedConfig"
      class="mt-16px p-12px bg-[var(--el-fill-color-light)] rounded-6px border border-[var(--el-border-color-lighter)]"
    >
      <div class="flex items-center gap-8px mb-12px">
        <Icon icon="ep:bell" class="text-[var(--el-color-warning)] text-16px" />
        <span class="text-14px font-500 text-[var(--el-text-color-primary)]">{{
          selectedConfig.name
        }}</span>
        <el-tag :type="selectedConfig.enabled ? 'success' : 'danger'" size="small">
          {{ selectedConfig.enabled ? '启用' : '禁用' }}
        </el-tag>
      </div>
      <div class="space-y-8px">
        <div class="flex items-start gap-8px">
          <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px">描述：</span>
          <span class="text-12px text-[var(--el-text-color-primary)] flex-1">{{
            selectedConfig.description
          }}</span>
        </div>
        <div class="flex items-start gap-8px">
          <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px">通知方式：</span>
          <span class="text-12px text-[var(--el-text-color-primary)] flex-1">{{
            getNotifyTypeName(selectedConfig.notifyType)
          }}</span>
        </div>
        <div v-if="selectedConfig.receivers" class="flex items-start gap-8px">
          <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px">接收人：</span>
          <span class="text-12px text-[var(--el-text-color-primary)] flex-1">{{
            selectedConfig.receivers.join(', ')
          }}</span>
        </div>
      </div>
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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit)

// 状态
const loading = ref(false)
const alertConfigs = ref<any[]>([])

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

// 初始化
onMounted(() => {
  getAlertConfigs()
})
</script>

<style scoped>
:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
