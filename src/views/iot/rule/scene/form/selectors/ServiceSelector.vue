<!-- 服务选择器组件 -->
<template>
  <div class="w-full">
    <el-select
      :model-value="modelValue"
      @update:model-value="handleChange"
      placeholder="请选择服务"
      filterable
      clearable
      class="w-full"
      :loading="loading"
      :disabled="!productId"
    >
      <el-option
        v-for="service in serviceList"
        :key="service.identifier"
        :label="service.name"
        :value="service.identifier"
      >
        <div class="flex items-center justify-between w-full py-4px">
          <div class="flex items-center gap-12px flex-1">
            <Icon
              icon="ep:service"
              class="text-18px text-[var(--el-color-success)] flex-shrink-0"
            />
            <div class="flex-1">
              <div class="text-14px font-500 text-[var(--el-text-color-primary)] mb-2px">
                {{ service.name }}
              </div>
              <div class="text-12px text-[var(--el-text-color-secondary)] leading-relaxed">
                {{ service.identifier }}
              </div>
              <div
                v-if="service.description"
                class="text-11px text-[var(--el-text-color-secondary)] mt-2px"
              >
                {{ service.description }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-8px">
            <el-tag :type="getCallTypeTag(service.callType)" size="small">
              {{ getCallTypeLabel(service.callType) }}
            </el-tag>
            <el-button
              ref="detailTriggerRef"
              type="info"
              :icon="InfoFilled"
              circle
              size="small"
              @click.stop="showServiceDetail(service)"
              title="查看服务详情"
            />
          </div>
        </div>
      </el-option>
    </el-select>

    <!-- 服务详情弹出层 -->
    <Teleport to="body">
      <div
        v-if="showServiceDetailPopover && selectedService"
        ref="serviceDetailRef"
        class="service-detail-popover"
        :style="servicePopoverStyle"
      >
        <div
          class="p-16px bg-white rounded-8px shadow-lg border border-[var(--el-border-color)] min-w-400px max-w-500px"
        >
          <div class="flex items-center gap-8px mb-16px">
            <Icon icon="ep:service" class="text-[var(--el-color-success)] text-18px" />
            <span class="text-16px font-600 text-[var(--el-text-color-primary)]">
              {{ selectedService.name }}
            </span>
            <el-tag :type="getCallTypeTag(selectedService.callType)" size="small">
              {{ getCallTypeLabel(selectedService.callType) }}
            </el-tag>
          </div>

          <div class="space-y-16px">
            <!-- 基本信息 -->
            <div>
              <div class="flex items-center gap-8px mb-8px">
                <Icon icon="ep:info" class="text-[var(--el-color-info)] text-14px" />
                <span class="text-14px font-500 text-[var(--el-text-color-primary)]">基本信息</span>
              </div>
              <div class="ml-22px space-y-4px">
                <div class="text-12px">
                  <span class="text-[var(--el-text-color-secondary)]">标识符：</span>
                  <span class="text-[var(--el-text-color-primary)]">{{
                    selectedService.identifier
                  }}</span>
                </div>
                <div v-if="selectedService.description" class="text-12px">
                  <span class="text-[var(--el-text-color-secondary)]">描述：</span>
                  <span class="text-[var(--el-text-color-primary)]">{{
                    selectedService.description
                  }}</span>
                </div>
                <div class="text-12px">
                  <span class="text-[var(--el-text-color-secondary)]">调用方式：</span>
                  <span class="text-[var(--el-text-color-primary)]">{{
                    getCallTypeLabel(selectedService.callType)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- 输入参数 -->
            <div v-if="selectedService.inputParams && selectedService.inputParams.length > 0">
              <div class="flex items-center gap-8px mb-8px">
                <Icon icon="ep:download" class="text-[var(--el-color-primary)] text-14px" />
                <span class="text-14px font-500 text-[var(--el-text-color-primary)]">输入参数</span>
              </div>
              <div class="ml-22px space-y-8px">
                <div
                  v-for="param in selectedService.inputParams"
                  :key="param.identifier"
                  class="flex items-center justify-between p-8px bg-[var(--el-fill-color-lighter)] rounded-4px"
                >
                  <div class="flex-1">
                    <div class="text-12px font-500 text-[var(--el-text-color-primary)]">
                      {{ param.name }}
                    </div>
                    <div class="text-11px text-[var(--el-text-color-secondary)]">
                      {{ param.identifier }}
                    </div>
                  </div>
                  <div class="flex items-center gap-8px">
                    <el-tag :type="getParamTypeTag(param.dataType)" size="small">
                      {{ getParamTypeName(param.dataType) }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>

            <!-- 输出参数 -->
            <div v-if="selectedService.outputParams && selectedService.outputParams.length > 0">
              <div class="flex items-center gap-8px mb-8px">
                <Icon icon="ep:upload" class="text-[var(--el-color-warning)] text-14px" />
                <span class="text-14px font-500 text-[var(--el-text-color-primary)]">输出参数</span>
              </div>
              <div class="ml-22px space-y-8px">
                <div
                  v-for="param in selectedService.outputParams"
                  :key="param.identifier"
                  class="flex items-center justify-between p-8px bg-[var(--el-fill-color-lighter)] rounded-4px"
                >
                  <div class="flex-1">
                    <div class="text-12px font-500 text-[var(--el-text-color-primary)]">
                      {{ param.name }}
                    </div>
                    <div class="text-11px text-[var(--el-text-color-secondary)]">
                      {{ param.identifier }}
                    </div>
                  </div>
                  <div class="flex items-center gap-8px">
                    <el-tag :type="getParamTypeTag(param.dataType)" size="small">
                      {{ getParamTypeName(param.dataType) }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 关闭按钮 -->
          <div class="flex justify-end mt-16px">
            <el-button size="small" @click="hideServiceDetail">关闭</el-button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { InfoFilled } from '@element-plus/icons-vue'
import { ThingModelApi } from '@/api/iot/thingmodel'
import { ThingModelService } from '@/api/iot/rule/scene/scene.types'
import { getThingModelServiceCallTypeLabel } from '@/views/iot/utils/constants'

/** 服务选择器组件 */
defineOptions({ name: 'ServiceSelector' })

const props = defineProps<{
  modelValue?: string
  productId?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value?: string): void
  (e: 'change', value?: string, service?: ThingModelService): void
}>()

// TODO @puhui999：这里不用的
const localValue = useVModel(props, 'modelValue', emit)

// 状态
const loading = ref(false)
const serviceList = ref<ThingModelService[]>([])
const showServiceDetailPopover = ref(false)
const selectedService = ref<ThingModelService | null>(null)
const detailTriggerRef = ref()
const serviceDetailRef = ref()
const servicePopoverStyle = ref({})

// 事件处理
const handleChange = (value?: string) => {
  // 更新 modelValue（这是 v-model 绑定的关键）
  emit('update:modelValue', value)

  // 触发 change 事件，传递服务对象
  const service = serviceList.value.find((s) => s.identifier === value)
  emit('change', value, service)
}

// 获取物模型TSL数据
const getThingModelTSL = async () => {
  if (!props.productId) {
    serviceList.value = []
    return
  }

  loading.value = true
  try {
    const tslData = await ThingModelApi.getThingModelTSLByProductId(props.productId)
    serviceList.value = tslData?.services || []
  } catch (error) {
    console.error('获取物模型TSL失败:', error)
    serviceList.value = []
  } finally {
    loading.value = false
  }
}

// 工具函数
const getCallTypeLabel = (callType: string) => {
  return getThingModelServiceCallTypeLabel(callType) || callType
}

const getCallTypeTag = (callType: string) => {
  return callType === 'sync' ? 'primary' : 'success'
}

// TODO @puhui999：一些注释风格；
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

// 服务详情弹出层控制
const showServiceDetail = (service: ThingModelService) => {
  selectedService.value = service
  showServiceDetailPopover.value = true

  nextTick(() => {
    updateServicePopoverPosition()
  })
}

const hideServiceDetail = () => {
  showServiceDetailPopover.value = false
  selectedService.value = null
}

const updateServicePopoverPosition = () => {
  if (!detailTriggerRef.value || !serviceDetailRef.value) return

  const triggerEl = detailTriggerRef.value.$el
  const triggerRect = triggerEl.getBoundingClientRect()

  // 计算弹出层位置
  const left = triggerRect.left + triggerRect.width + 8
  const top = triggerRect.top

  // 检查是否超出视窗右边界
  const popoverWidth = 500
  const viewportWidth = window.innerWidth

  let finalLeft = left
  if (left + popoverWidth > viewportWidth - 16) {
    finalLeft = triggerRect.left - popoverWidth - 8
  }

  // 检查是否超出视窗下边界
  let finalTop = top
  const popoverHeight = serviceDetailRef.value.offsetHeight || 300
  const viewportHeight = window.innerHeight

  if (top + popoverHeight > viewportHeight - 16) {
    finalTop = Math.max(16, viewportHeight - popoverHeight - 16)
  }

  servicePopoverStyle.value = {
    position: 'fixed',
    left: `${finalLeft}px`,
    top: `${finalTop}px`,
    zIndex: 9999
  }
}

// 监听产品变化
watch(
  () => props.productId,
  () => {
    getThingModelTSL()
  },
  { immediate: true }
)

// 监听modelValue变化，处理编辑模式的回显
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && serviceList.value.length > 0) {
      // 确保服务列表已加载，然后设置选中的服务
      const service = serviceList.value.find((s) => s.identifier === newValue)
      if (service) {
        selectedService.value = service
      }
    }
  },
  { immediate: true }
)

// 监听服务列表变化，处理异步加载后的回显
watch(
  () => serviceList.value,
  (newServiceList) => {
    if (newServiceList.length > 0 && props.modelValue) {
      // 服务列表加载完成后，如果有modelValue，设置选中的服务
      const service = newServiceList.find((s) => s.identifier === props.modelValue)
      if (service) {
        selectedService.value = service
      }
    }
  },
  { immediate: true }
)

// 监听窗口大小变化
const handleResize = () => {
  if (showServiceDetailPopover.value) {
    updateServicePopoverPosition()
  }
}

// 点击外部关闭弹出层
const handleClickOutside = (event: MouseEvent) => {
  if (
    showServiceDetailPopover.value &&
    serviceDetailRef.value &&
    detailTriggerRef.value &&
    !serviceDetailRef.value.contains(event.target as Node) &&
    !detailTriggerRef.value.$el.contains(event.target as Node)
  ) {
    hideServiceDetail()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
})
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

.service-detail-popover {
  animation: fadeInScale 0.2s ease-out;
  transform-origin: top left;
}

.service-detail-popover::before {
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

.service-detail-popover::after {
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

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
