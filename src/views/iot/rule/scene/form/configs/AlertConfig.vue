<!-- 告警配置组件 -->
<template>
  <div class="w-full">
    <!-- 告警配置选择区域 -->
    <div
      class="border border-[var(--el-border-color-light)] rounded-6px p-16px bg-[var(--el-fill-color-blank)]"
    >
      <div class="flex items-center gap-8px mb-12px">
        <Icon icon="ep:bell" class="text-[var(--el-color-warning)] text-16px" />
        <span class="text-14px font-600 text-[var(--el-text-color-primary)]">告警配置选择</span>
        <el-tag size="small" type="warning">必选</el-tag>
      </div>

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
          <template #empty>
            <div class="text-center py-20px">
              <Icon
                icon="ep:warning"
                class="text-24px text-[var(--el-text-color-placeholder)] mb-8px"
              />
              <p class="text-12px text-[var(--el-text-color-secondary)]">暂无可用的告警配置</p>
            </div>
          </template>
          <el-option
            v-for="config in alertConfigs"
            :key="config.id"
            :label="config.name"
            :value="config.id"
            :disabled="!config.enabled"
          >
            <div class="flex items-center justify-between w-full py-6px">
              <div class="flex items-center gap-12px flex-1">
                <Icon
                  :icon="config.enabled ? 'ep:circle-check' : 'ep:circle-close'"
                  :class="
                    config.enabled
                      ? 'text-[var(--el-color-success)]'
                      : 'text-[var(--el-color-danger)]'
                  "
                  class="text-16px flex-shrink-0"
                />
                <div class="flex-1">
                  <div class="text-14px font-500 text-[var(--el-text-color-primary)] mb-2px">{{
                    config.name
                  }}</div>
                  <div class="text-12px text-[var(--el-text-color-secondary)] line-clamp-1">{{
                    config.description
                  }}</div>
                </div>
              </div>
              <div class="flex items-center gap-8px">
                <el-tag :type="getNotifyTypeTag(config.notifyType)" size="small">
                  {{ getNotifyTypeName(config.notifyType) }}
                </el-tag>
                <el-tag :type="config.enabled ? 'success' : 'danger'" size="small">
                  {{ config.enabled ? '启用' : '禁用' }}
                </el-tag>
              </div>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
    </div>

    <!-- 告警配置详情 -->
    <div
      v-if="selectedConfig"
      class="mt-16px border border-[var(--el-border-color-light)] rounded-6px p-16px bg-gradient-to-r from-orange-50 to-yellow-50"
    >
      <div class="flex items-center gap-8px mb-16px">
        <Icon icon="ep:info-filled" class="text-[var(--el-color-warning)] text-18px" />
        <span class="text-16px font-600 text-[var(--el-text-color-primary)]">配置详情</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-16px">
        <!-- 基本信息 -->
        <div class="space-y-12px">
          <div class="flex items-center gap-8px">
            <Icon icon="ep:document" class="text-[var(--el-color-primary)] text-14px" />
            <span class="text-14px font-500 text-[var(--el-text-color-primary)]">基本信息</span>
          </div>
          <div class="pl-22px space-y-8px">
            <div class="flex items-start gap-8px">
              <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px">名称：</span>
              <span class="text-12px text-[var(--el-text-color-primary)] flex-1 font-500">{{
                selectedConfig.name
              }}</span>
            </div>
            <div class="flex items-start gap-8px">
              <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px">描述：</span>
              <span class="text-12px text-[var(--el-text-color-primary)] flex-1">{{
                selectedConfig.description
              }}</span>
            </div>
            <div class="flex items-start gap-8px">
              <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px">状态：</span>
              <el-tag :type="selectedConfig.enabled ? 'success' : 'danger'" size="small">
                {{ selectedConfig.enabled ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 通知配置 -->
        <div class="space-y-12px">
          <div class="flex items-center gap-8px">
            <Icon icon="ep:message" class="text-[var(--el-color-success)] text-14px" />
            <span class="text-14px font-500 text-[var(--el-text-color-primary)]">通知配置</span>
          </div>
          <div class="pl-22px space-y-8px">
            <div class="flex items-start gap-8px">
              <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px">方式：</span>
              <el-tag :type="getNotifyTypeTag(selectedConfig.notifyType)" size="small">
                {{ getNotifyTypeName(selectedConfig.notifyType) }}
              </el-tag>
            </div>
            <div
              v-if="selectedConfig.receivers && selectedConfig.receivers.length > 0"
              class="flex items-start gap-8px"
            >
              <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px"
                >接收人：</span
              >
              <div class="flex-1">
                <div class="flex flex-wrap gap-4px">
                  <el-tag
                    v-for="receiver in selectedConfig.receivers.slice(0, 3)"
                    :key="receiver"
                    size="small"
                    type="info"
                  >
                    {{ receiver }}
                  </el-tag>
                  <el-tag v-if="selectedConfig.receivers.length > 3" size="small" type="info">
                    +{{ selectedConfig.receivers.length - 3 }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
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

const getNotifyTypeTag = (type: number) => {
  const tagMap = {
    1: 'primary', // 邮件
    2: 'success', // 短信
    3: 'warning', // 微信
    4: 'info' // 钉钉
  }
  return tagMap[type] || 'info'
}

// 事件处理
const handleChange = (value?: number) => {
  // 可以在这里添加额外的处理逻辑
  console.log('告警配置选择变化:', value)
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
