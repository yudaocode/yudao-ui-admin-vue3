<!-- 服务参数输入组件 -->
<template>
  <div class="w-full min-w-0">
    <!-- 服务参数配置 -->
    <div v-if="serviceConfig && serviceConfig.service" class="space-y-12px">
      <!-- JSON 输入框 -->
      <div class="relative">
        <el-input
          v-model="paramsJson"
          type="textarea"
          :rows="4"
          placeholder="请输入JSON格式的服务参数"
          @input="handleParamsChange"
          :class="{ 'is-error': jsonError }"
        />
        <!-- 查看详细示例按钮 -->
        <div class="absolute top-8px right-8px">
          <el-button
            ref="exampleTriggerRef"
            type="info"
            :icon="InfoFilled"
            circle
            size="small"
            @click="toggleExampleDetail"
            title="查看参数示例"
          />
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
            {{ jsonError || 'JSON格式正确' }}
          </span>
        </div>

        <!-- 快速填充按钮 -->
        <div v-if="inputParams.length > 0" class="flex items-center gap-8px">
          <span class="text-12px text-[var(--el-text-color-secondary)]">快速填充：</span>
          <el-button size="small" type="primary" plain @click="fillExampleJson">
            示例数据
          </el-button>
          <el-button size="small" type="default" plain @click="clearParams"> 清空 </el-button>
        </div>
      </div>

      <!-- 详细示例弹出层 -->
      <Teleport to="body">
        <div
          v-if="showExampleDetail"
          ref="exampleDetailRef"
          class="example-detail-popover"
          :style="examplePopoverStyle"
        >
          <div
            class="p-16px bg-white rounded-8px shadow-lg border border-[var(--el-border-color)] min-w-400px max-w-500px"
          >
            <div class="flex items-center gap-8px mb-16px">
              <Icon icon="ep:service" class="text-[var(--el-color-primary)] text-18px" />
              <span class="text-16px font-600 text-[var(--el-text-color-primary)]">
                {{ serviceConfig.name }} - 参数示例
              </span>
            </div>

            <div class="space-y-16px">
              <!-- 服务参数示例 -->
              <div v-if="inputParams.length > 0">
                <div class="flex items-center gap-8px mb-8px">
                  <Icon icon="ep:edit" class="text-[var(--el-color-primary)] text-14px" />
                  <span class="text-14px font-500 text-[var(--el-text-color-primary)]">
                    输入参数
                  </span>
                </div>
                <div class="ml-22px space-y-8px">
                  <div
                    v-for="param in inputParams"
                    :key="param.identifier"
                    class="flex items-center justify-between p-8px bg-[var(--el-fill-color-lighter)] rounded-4px"
                  >
                    <div class="flex-1">
                      <div class="text-12px font-500 text-[var(--el-text-color-primary)]">
                        {{ param.name }}
                        <el-tag v-if="param.required" size="small" type="danger" class="ml-4px"
                          >必填</el-tag
                        >
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
                    完整JSON格式：
                  </div>
                  <pre
                    class="p-12px bg-[var(--el-fill-color-light)] rounded-4px text-11px text-[var(--el-text-color-primary)] overflow-x-auto border-l-3px border-[var(--el-color-primary)]"
                  ><code>{{ generateExampleJson() }}</code></pre>
                </div>
              </div>

              <!-- 无参数提示 -->
              <div v-else>
                <div class="text-center py-16px">
                  <p class="text-14px text-[var(--el-text-color-secondary)]">此服务无需输入参数</p>
                </div>
              </div>
            </div>

            <!-- 关闭按钮 -->
            <div class="flex justify-end mt-16px">
              <el-button size="small" @click="hideExampleDetail">关闭</el-button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>

    <!-- 无服务配置提示 -->
    <div v-else class="text-center py-20px">
      <p class="text-14px text-[var(--el-text-color-secondary)]">请先选择服务</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { InfoFilled } from '@element-plus/icons-vue'

/** 服务参数输入组件 */
defineOptions({ name: 'ServiceParamsInput' })

interface Props {
  modelValue?: string
  serviceConfig?: any
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit, {
  defaultValue: ''
})

// 状态
const paramsJson = ref('')
const jsonError = ref('')

// 示例弹出层相关状态
const showExampleDetail = ref(false)
const exampleTriggerRef = ref()
const exampleDetailRef = ref()
const examplePopoverStyle = ref({})

// 计算属性
const inputParams = computed(() => {
  return props.serviceConfig?.service?.inputParams || []
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
        jsonError.value = '参数必须是一个有效的JSON对象'
        emit('validate', { valid: false, message: jsonError.value })
        return
      }

      // 验证必填参数
      for (const param of inputParams.value) {
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
  const exampleData = generateExampleJson()
  paramsJson.value = exampleData
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
  if (inputParams.value.length === 0) {
    return '{}'
  }

  const example = {}
  inputParams.value.forEach((param) => {
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

// 示例弹出层控制方法
const toggleExampleDetail = () => {
  if (showExampleDetail.value) {
    hideExampleDetail()
  } else {
    showExampleDetailPopover()
  }
}

const showExampleDetailPopover = () => {
  if (!exampleTriggerRef.value) return

  showExampleDetail.value = true

  nextTick(() => {
    updateExamplePopoverPosition()
  })
}

const hideExampleDetail = () => {
  showExampleDetail.value = false
}

const updateExamplePopoverPosition = () => {
  if (!exampleTriggerRef.value || !exampleDetailRef.value) return

  const triggerEl = exampleTriggerRef.value.$el
  const triggerRect = triggerEl.getBoundingClientRect()

  // 计算弹出层位置
  const left = triggerRect.left + triggerRect.width + 8
  const top = triggerRect.top

  // 检查是否超出视窗右边界
  const popoverWidth = 500 // 最大宽度
  const viewportWidth = window.innerWidth

  let finalLeft = left
  if (left + popoverWidth > viewportWidth - 16) {
    // 如果超出右边界，显示在左侧
    finalLeft = triggerRect.left - popoverWidth - 8
  }

  // 检查是否超出视窗下边界
  let finalTop = top
  const popoverHeight = exampleDetailRef.value.offsetHeight || 300
  const viewportHeight = window.innerHeight

  if (top + popoverHeight > viewportHeight - 16) {
    finalTop = Math.max(16, viewportHeight - popoverHeight - 16)
  }

  examplePopoverStyle.value = {
    position: 'fixed',
    left: `${finalLeft}px`,
    top: `${finalTop}px`,
    zIndex: 9999
  }
}

// 点击外部关闭弹出层
const handleClickOutside = (event: MouseEvent) => {
  if (
    showExampleDetail.value &&
    exampleDetailRef.value &&
    exampleTriggerRef.value &&
    !exampleDetailRef.value.contains(event.target as Node) &&
    !exampleTriggerRef.value.$el.contains(event.target as Node)
  ) {
    hideExampleDetail()
  }
}

// 监听窗口大小变化，重新计算弹出层位置
const handleResize = () => {
  if (showExampleDetail.value) {
    updateExamplePopoverPosition()
  }
}

// 初始化
onMounted(() => {
  if (localValue.value) {
    try {
      paramsJson.value = localValue.value
      jsonError.value = ''
    } catch (error) {
      console.error('初始化参数失败:', error)
      jsonError.value = '初始参数格式错误'
    }
  }

  // 添加事件监听器
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
})

// 监听输入值变化
watch(
  () => localValue.value,
  (newValue) => {
    if (newValue !== paramsJson.value) {
      paramsJson.value = newValue || ''
    }
  }
)

// 监听服务配置变化
watch(
  () => props.serviceConfig,
  () => {
    // 服务变化时清空参数
    paramsJson.value = ''
    localValue.value = ''
    jsonError.value = ''
  }
)
</script>

<style scoped>
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-4px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.example-detail-popover {
  animation: fadeInScale 0.2s ease-out;
  transform-origin: top left;
}

/* 弹出层箭头效果 */
.example-detail-popover::before {
  position: absolute;
  top: 20px;
  left: -8px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-right: 8px solid var(--el-border-color);
  border-bottom: 8px solid transparent;
  content: '';
}

.example-detail-popover::after {
  position: absolute;
  top: 20px;
  left: -7px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-right: 8px solid white;
  border-bottom: 8px solid transparent;
  content: '';
}
</style>
