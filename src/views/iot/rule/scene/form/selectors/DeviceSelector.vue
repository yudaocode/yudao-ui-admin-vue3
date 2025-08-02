<!-- 设备选择器组件 -->
<template>
  <el-select
    :model-value="modelValue"
    @update:model-value="handleChange"
    placeholder="请选择设备"
    filterable
    clearable
    class="w-full"
    :loading="deviceLoading"
    :disabled="!productId"
  >
    <el-option
      v-for="device in deviceList"
      :key="device.id"
      :label="device.deviceName"
      :value="device.id"
    >
      <div class="flex items-center justify-between w-full py-4px">
        <div class="flex-1">
          <div class="text-14px font-500 text-[var(--el-text-color-primary)] mb-2px"
            >{{ device.deviceName }}
          </div>
          <div class="text-12px text-[var(--el-text-color-secondary)]">{{ device.deviceKey }}</div>
        </div>
        <div class="flex items-center gap-4px">
          <el-tag size="small" :type="getStatusType(device.status)">
            {{ getStatusText(device.status) }}
          </el-tag>
          <el-tag size="small" :type="device.activeTime ? 'success' : 'info'">
            {{ device.activeTime ? '已激活' : '未激活' }}
          </el-tag>
        </div>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { DeviceApi } from '@/api/iot/device/device'

/** 设备选择器组件 */
defineOptions({ name: 'DeviceSelector' })

const props = defineProps<{
  modelValue?: number
  productId?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value?: number): void
  (e: 'change', value?: number): void
}>()

// 状态
const deviceLoading = ref(false)
const deviceList = ref<any[]>([])

// 事件处理
const handleChange = (value?: number) => {
  emit('update:modelValue', value)
  emit('change', value)
}

// 获取设备列表
const getDeviceList = async () => {
  if (!props.productId) {
    deviceList.value = []
    return
  }

  try {
    deviceLoading.value = true
    const res = await DeviceApi.getDeviceListByProductId(props.productId)
    deviceList.value = res || []
  } catch (error) {
    console.error('获取设备列表失败:', error)
    deviceList.value = []
  } finally {
    deviceList.value.push({ id: 0, deviceName: '全部设备' })
    deviceLoading.value = false
  }
}

// 设备状态映射
const getStatusType = (status: number) => {
  switch (status) {
    case 0:
      return 'success' // 正常
    case 1:
      return 'danger' // 禁用
    default:
      return 'info'
  }
}

const getStatusText = (status: number) => {
  switch (status) {
    case 0:
      return '正常'
    case 1:
      return '禁用'
    default:
      return '未知'
  }
}

// 监听产品变化
watch(
  () => props.productId,
  (newProductId) => {
    if (newProductId) {
      getDeviceList()
    } else {
      deviceList.value = []
      // 清空当前选择的设备
      if (props.modelValue) {
        emit('update:modelValue', undefined)
        emit('change', undefined)
      }
    }
  },
  { immediate: true }
)
</script>
