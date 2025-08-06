<!-- JSON参数输入组件 - 通用版本 -->
<template>
  <div class="w-full min-w-0">
    <!-- 参数配置 -->
    <div v-if="hasConfig" class="space-y-12px">
      <!-- JSON 输入框 -->
      <div class="relative">
        <el-input
          v-model="paramsJson"
          type="textarea"
          :rows="4"
          :placeholder="placeholder"
          @input="handleParamsChange"
          :class="{ 'is-error': jsonError }"
        />
        <!-- 查看详细示例弹出层 -->
        <div class="absolute top-8px right-8px">
          <el-popover
            placement="left-start"
            :width="450"
            trigger="click"
            :show-arrow="true"
            :offset="8"
            popper-class="json-params-detail-popover"
          >
            <template #reference>
              <el-button type="info" :icon="InfoFilled" circle size="small" title="查看参数示例" />
            </template>

            <!-- 弹出层内容 -->
            <div class="json-params-detail-content">
              <div class="flex items-center gap-8px mb-16px">
                <Icon :icon="titleIcon" class="text-[var(--el-color-primary)] text-18px" />
                <span class="text-16px font-600 text-[var(--el-text-color-primary)]">
                  {{ title }}
                </span>
              </div>

              <div class="space-y-16px">
                <!-- 参数列表 -->
                <div v-if="paramsList.length > 0">
                  <div class="flex items-center gap-8px mb-8px">
                    <Icon :icon="paramsIcon" class="text-[var(--el-color-primary)] text-14px" />
                    <span class="text-14px font-500 text-[var(--el-text-color-primary)]">
                      {{ paramsLabel }}
                    </span>
                  </div>
                  <div class="ml-22px space-y-8px">
                    <div
                      v-for="param in paramsList"
                      :key="param.identifier"
                      class="flex items-center justify-between p-8px bg-[var(--el-fill-color-lighter)] rounded-4px"
                    >
                      <div class="flex-1">
                        <div class="text-12px font-500 text-[var(--el-text-color-primary)]">
                          {{ param.name }}
                          <el-tag v-if="param.required" size="small" type="danger" class="ml-4px">
                            必填
                          </el-tag>
                        </div>
                        <div class="text-11px text-[var(--el-text-color-secondary)]">
                          {{ param.identifier }}
                        </div>
                      </div>
                      <div class="flex items-center gap-8px">
                        <el-tag :type="getParamTypeTag(param.dataType)" size="small">
                          {{ getParamTypeName(param.dataType) }}
                        </el-tag>
                        <span class="text-11px text-[var(--el-text-color-secondary)]">
                          {{ getExampleValue(param) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="mt-12px ml-22px">
                    <div class="text-12px text-[var(--el-text-color-secondary)] mb-6px">
                      完整 JSON 格式：
                    </div>
                    <pre
                      class="p-12px bg-[var(--el-fill-color-light)] rounded-4px text-11px text-[var(--el-text-color-primary)] overflow-x-auto border-l-3px border-[var(--el-color-primary)]"
                    >
                      <code>{{ generateExampleJson() }}</code>
                    </pre>
                  </div>
                </div>

                <!-- 无参数提示 -->
                <div v-else>
                  <div class="text-center py-16px">
                    <p class="text-14px text-[var(--el-text-color-secondary)]">{{
                      emptyMessage
                    }}</p>
                  </div>
                </div>
              </div>
            </div>
          </el-popover>
        </div>
      </div>

      <!-- 验证状态和错误提示 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8px">
          <Icon
            :icon="jsonError ? 'ep:warning' : 'ep:circle-check'"
            :class="jsonError ? 'text-[var(--el-color-danger)]' : 'text-[var(--el-color-success)]'"
            class="text-14px"
          />
          <span
            :class="jsonError ? 'text-[var(--el-color-danger)]' : 'text-[var(--el-color-success)]'"
            class="text-12px"
          >
            {{ jsonError || 'JSON 格式正确' }}
          </span>
        </div>

        <!-- 快速填充按钮 -->
        <div v-if="paramsList.length > 0" class="flex items-center gap-8px">
          <span class="text-12px text-[var(--el-text-color-secondary)]">快速填充：</span>
          <el-button size="small" type="primary" plain @click="fillExampleJson">
            示例数据
          </el-button>
          <el-button size="small" type="danger" plain @click="clearParams"> 清空</el-button>
        </div>
      </div>
    </div>

    <!-- 无配置提示 -->
    <div v-else class="text-center py-20px">
      <p class="text-14px text-[var(--el-text-color-secondary)]">{{ noConfigMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { InfoFilled } from '@element-plus/icons-vue'

/** JSON参数输入组件 - 通用版本 */
defineOptions({ name: 'JsonParamsInput' })

export interface JsonParamsConfig {
  // 服务配置
  service?: {
    name: string
    inputParams?: any[]
  }
  // 事件配置
  event?: {
    name: string
    outputParams?: any[]
  }
  // 属性配置
  properties?: any[]
  // 自定义配置
  custom?: {
    name: string
    params: any[]
  }
}

interface Props {
  modelValue?: string
  config?: JsonParamsConfig
  type?: 'service' | 'event' | 'property' | 'custom'
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'service',
  placeholder: '请输入JSON格式的参数'
})

const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit, {
  defaultValue: ''
})

// 状态
const paramsJson = ref('')
const jsonError = ref('')

// 计算属性
const hasConfig = computed(() => {
  // TODO @puhui999: 后续统一处理
  console.log(props.config)
  // return !!(
  //   props.config?.service ||
  //   props.config?.event ||
  //   props.config?.properties ||
  //   props.config?.custom
  // )
  return true
})

const paramsList = computed(() => {
  switch (props.type) {
    case 'service':
      return props.config?.service?.inputParams || []
    case 'event':
      return props.config?.event?.outputParams || []
    case 'property':
      return props.config?.properties || []
    case 'custom':
      return props.config?.custom?.params || []
    default:
      return []
  }
})

const title = computed(() => {
  switch (props.type) {
    case 'service':
      return `${props.config?.service?.name || '服务'} - 输入参数示例`
    case 'event':
      return `${props.config?.event?.name || '事件'} - 输出参数示例`
    case 'property':
      return '属性设置 - 参数示例'
    case 'custom':
      return `${props.config?.custom?.name || '自定义'} - 参数示例`
    default:
      return '参数示例'
  }
})

const titleIcon = computed(() => {
  switch (props.type) {
    case 'service':
      return 'ep:service'
    case 'event':
      return 'ep:bell'
    case 'property':
      return 'ep:edit'
    case 'custom':
      return 'ep:document'
    default:
      return 'ep:document'
  }
})

const paramsIcon = computed(() => {
  switch (props.type) {
    case 'service':
      return 'ep:edit'
    case 'event':
      return 'ep:upload'
    case 'property':
      return 'ep:setting'
    case 'custom':
      return 'ep:list'
    default:
      return 'ep:edit'
  }
})

const paramsLabel = computed(() => {
  switch (props.type) {
    case 'service':
      return '输入参数'
    case 'event':
      return '输出参数'
    case 'property':
      return '属性参数'
    case 'custom':
      return '参数列表'
    default:
      return '参数'
  }
})

const emptyMessage = computed(() => {
  switch (props.type) {
    case 'service':
      return '此服务无需输入参数'
    case 'event':
      return '此事件无输出参数'
    case 'property':
      return '无可设置的属性'
    case 'custom':
      return '无参数配置'
    default:
      return '无参数'
  }
})

const noConfigMessage = computed(() => {
  switch (props.type) {
    case 'service':
      return '请先选择服务'
    case 'event':
      return '请先选择事件'
    case 'property':
      return '请先选择产品'
    case 'custom':
      return '请先进行配置'
    default:
      return '请先进行配置'
  }
})

// 事件处理
const handleParamsChange = () => {
  try {
    jsonError.value = '' // 清除之前的错误

    if (paramsJson.value.trim()) {
      const parsed = JSON.parse(paramsJson.value)
      localValue.value = paramsJson.value

      // 额外的参数验证
      if (typeof parsed !== 'object' || parsed === null) {
        jsonError.value = '参数必须是一个有效的 JSON 对象'
        emit('validate', { valid: false, message: jsonError.value })
        return
      }

      // 验证必填参数
      for (const param of paramsList.value) {
        if (param.required && (!parsed[param.identifier] || parsed[param.identifier] === '')) {
          jsonError.value = `参数 ${param.name} 为必填项`
          emit('validate', { valid: false, message: jsonError.value })
          return
        }
      }
    } else {
      localValue.value = ''
    }

    // 验证通过
    emit('validate', { valid: true, message: 'JSON格式正确' })
  } catch (error) {
    jsonError.value = `JSON格式错误: ${error instanceof Error ? error.message : '未知错误'}`
    emit('validate', { valid: false, message: jsonError.value })
  }
}

// 快速填充示例数据
const fillExampleJson = () => {
  paramsJson.value = generateExampleJson()
  handleParamsChange()
}

// 清空参数
const clearParams = () => {
  paramsJson.value = ''
  localValue.value = ''
  jsonError.value = ''
  emit('validate', { valid: true, message: '' })
}

// 工具函数
const getParamTypeName = (dataType: string) => {
  const typeMap = {
    int: '整数',
    float: '浮点数',
    double: '双精度',
    text: '字符串',
    bool: '布尔值',
    enum: '枚举',
    date: '日期',
    struct: '结构体',
    array: '数组'
  }
  return typeMap[dataType] || dataType
}

const getParamTypeTag = (dataType: string) => {
  const tagMap = {
    int: 'primary',
    float: 'success',
    double: 'success',
    text: 'info',
    bool: 'warning',
    enum: 'danger',
    date: 'primary',
    struct: 'info',
    array: 'warning'
  }
  return tagMap[dataType] || 'info'
}

const getExampleValue = (param: any) => {
  switch (param.dataType) {
    case 'int':
      return '25'
    case 'float':
    case 'double':
      return '25.5'
    case 'bool':
      return 'false'
    case 'text':
      return '"auto"'
    case 'enum':
      return '"option1"'
    case 'struct':
      return '{}'
    case 'array':
      return '[]'
    default:
      return '""'
  }
}

const generateExampleJson = () => {
  if (paramsList.value.length === 0) {
    return '{}'
  }

  const example = {}
  paramsList.value.forEach((param) => {
    switch (param.dataType) {
      case 'int':
        example[param.identifier] = 25
        break
      case 'float':
      case 'double':
        example[param.identifier] = 25.5
        break
      case 'bool':
        example[param.identifier] = false
        break
      case 'text':
        example[param.identifier] = 'auto'
        break
      case 'struct':
        example[param.identifier] = {}
        break
      case 'array':
        example[param.identifier] = []
        break
      default:
        example[param.identifier] = ''
    }
  })

  return JSON.stringify(example, null, 2)
}

// 处理数据回显的函数
// TODO @puhui999：注释风格；
const handleDataDisplay = (value: string) => {
  if (!value || !value.trim()) {
    paramsJson.value = ''
    jsonError.value = ''
    return
  }

  try {
    // 尝试解析JSON，如果成功则格式化
    const parsed = JSON.parse(value)
    paramsJson.value = JSON.stringify(parsed, null, 2)
    jsonError.value = ''
  } catch {
    // 如果不是有效的JSON，直接使用原字符串
    paramsJson.value = value
    jsonError.value = ''
  }
}

// 监听外部值变化（编辑模式数据回显）
watch(
  () => localValue.value,
  (newValue, oldValue) => {
    // 避免循环更新
    if (newValue === oldValue) return

    // 使用 nextTick 确保在下一个 tick 中处理数据
    nextTick(() => {
      handleDataDisplay(newValue || '')
    })
  },
  { immediate: true }
)

// 组件挂载后也尝试处理一次数据回显
onMounted(() => {
  nextTick(() => {
    if (localValue.value) {
      handleDataDisplay(localValue.value)
    }
  })
})

// 监听配置变化
watch(
  () => props.config,
  (newConfig, oldConfig) => {
    // 只有在配置真正变化时才清空数据
    if (JSON.stringify(newConfig) !== JSON.stringify(oldConfig)) {
      // 如果没有外部传入的值，才清空数据
      if (!localValue.value) {
        paramsJson.value = ''
        jsonError.value = ''
      }
    }
  }
)
</script>

<style scoped>
/** TODO @puhui999：unocss，看看哪些可以搞掉哈。 */
/* 弹出层内容样式 */
.json-params-detail-content {
  padding: 4px 0;
}

/* 弹出层自定义样式 */
:global(.json-params-detail-popover) {
  max-width: 500px !important;
}

:global(.json-params-detail-popover .el-popover__content) {
  padding: 16px !important;
}

/* JSON 代码块样式 */
.json-params-detail-content pre {
  max-height: 200px;
  overflow-y: auto;
}
</style>
