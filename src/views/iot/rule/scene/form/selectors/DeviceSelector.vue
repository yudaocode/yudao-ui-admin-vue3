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
          <div class="text-14px font-500 text-[var(--el-text-color-primary)] mb-2px">
            {{ device.deviceName }}
          </div>
          <div class="text-12px text-[var(--el-text-color-secondary)]">{{ device.deviceKey }}</div>
        </div>
        <div class="flex items-center gap-4px" v-if="device.id > 0">
          <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="device.state" />
        </div>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { DeviceApi } from '@/api/iot/device/device'
import { DEVICE_SELECTOR_OPTIONS } from '@/views/iot/utils/constants'
import { DICT_TYPE } from '@/utils/dict'

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

const deviceLoading = ref(false) // 设备加载状态
const deviceList = ref<any[]>([]) // 设备列表

/**
 * 处理选择变化事件
 * @param value 选中的设备ID
 */
const handleChange = (value?: number) => {
  emit('update:modelValue', value)
  emit('change', value)
}

/**
 * 获取设备列表
 */
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
    deviceList.value.unshift(DEVICE_SELECTOR_OPTIONS.ALL_DEVICES)
    deviceLoading.value = false
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
