<!-- 产品设备选择器组件 -->
<template>
  <div class="product-device-selector">
    <el-row :gutter="16">
      <!-- 产品选择 -->
      <el-col :span="12">
        <el-form-item label="选择产品" required>
          <el-select
            v-model="localProductId"
            placeholder="请选择产品"
            filterable
            clearable
            @change="handleProductChange"
            class="w-full"
            :loading="productLoading"
          >
            <el-option
              v-for="product in productList"
              :key="product.id"
              :label="product.name"
              :value="product.id"
            >
              <div class="flex items-center justify-between w-full py-4px">
                <div class="flex-1">
                  <div class="text-14px font-500 text-[var(--el-text-color-primary)] mb-2px">
                    {{ product.name }}
                  </div>
                  <div class="text-12px text-[var(--el-text-color-secondary)]">
                    {{ product.productKey }}
                  </div>
                </div>
                <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="product.status" />
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>

      <!-- 设备选择模式 -->
      <el-col :span="12">
        <el-form-item label="设备选择模式" required>
          <el-radio-group
            v-model="deviceSelectionMode"
            @change="handleDeviceSelectionModeChange"
            :disabled="!localProductId"
          >
            <el-radio value="all">全部设备</el-radio>
            <el-radio value="specific">选择设备</el-radio>
          </el-radio-group>
          <div
            v-if="!localProductId"
            class="text-12px text-[var(--el-text-color-placeholder)] mt-4px"
          >
            请先选择产品
          </div>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 具体设备选择 -->
    <el-row v-if="deviceSelectionMode === 'specific'" :gutter="16">
      <el-col :span="24">
        <el-form-item label="选择设备" required>
          <el-select
            v-model="localDeviceId"
            :placeholder="localProductId ? '请选择设备' : '请先选择产品'"
            filterable
            clearable
            @change="handleDeviceChange"
            class="w-full"
            :loading="deviceLoading"
            :disabled="!localProductId"
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
                  <div class="text-12px text-[var(--el-text-color-secondary)]">
                    {{ device.nickname || '无备注' }}
                  </div>
                </div>
                <el-tag size="small" :type="getDeviceStatusTag(device.state)">
                  {{ getDeviceStatusText(device.state) }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 选择结果展示 -->
    <div
      v-if="localProductId && localDeviceId !== undefined"
      class="mt-16px p-12px bg-[var(--el-fill-color-light)] rounded-6px border border-[var(--el-border-color-lighter)]"
    >
      <div class="flex items-center gap-6px mb-8px">
        <Icon icon="ep:check" class="text-[var(--el-color-success)] text-16px" />
        <span class="text-14px font-500 text-[var(--el-text-color-primary)]">已选择设备</span>
      </div>
      <div class="flex flex-col gap-6px ml-22px">
        <div class="flex items-center gap-8px">
          <span class="text-12px text-[var(--el-text-color-secondary)] min-w-40px">产品：</span>
          <span class="text-12px text-[var(--el-text-color-primary)] font-500">
            {{ selectedProduct?.name }}
          </span>
          <el-tag size="small" type="primary">{{ selectedProduct?.productKey }}</el-tag>
        </div>
        <div class="flex items-center gap-8px">
          <span class="text-12px text-[var(--el-text-color-secondary)] min-w-40px">设备：</span>
          <span
            v-if="deviceSelectionMode === 'all'"
            class="text-12px text-[var(--el-text-color-primary)] font-500"
            >全部设备</span
          >
          <span v-else class="text-12px text-[var(--el-text-color-primary)] font-500">
            {{ selectedDevice?.deviceName }}
          </span>
          <el-tag v-if="deviceSelectionMode === 'all'" size="small" type="warning"> 全部</el-tag>
          <el-tag v-else size="small" :type="getDeviceStatusTag(selectedDevice?.state)">
            {{ getDeviceStatusText(selectedDevice?.state) }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { ProductApi } from '@/api/iot/product/product'
import { DeviceApi } from '@/api/iot/device/device'
import { DICT_TYPE } from '@/utils/dict'

/** 产品设备选择器组件 */
defineOptions({ name: 'ProductDeviceSelector' })

interface Props {
  productId?: number
  deviceId?: number
}

interface Emits {
  (e: 'update:productId', value?: number): void
  (e: 'update:deviceId', value?: number): void
  (e: 'change', value: { productId?: number; deviceId?: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localProductId = useVModel(props, 'productId', emit)
const localDeviceId = useVModel(props, 'deviceId', emit)

// 设备选择模式
// 默认选择具体设备，这样用户可以看到设备选择器
const deviceSelectionMode = ref<'specific' | 'all'>('specific')

// 数据状态
const productLoading = ref(false)
const deviceLoading = ref(false)
const productList = ref<any[]>([])
const deviceList = ref<any[]>([])

// 计算属性
const selectedProduct = computed(() => {
  return productList.value.find((p) => p.id === localProductId.value)
})

const selectedDevice = computed(() => {
  return deviceList.value.find((d) => d.id === localDeviceId.value)
})

// TODO @puhui999：字典下；
// 设备状态映射
const getDeviceStatusText = (state?: number) => {
  switch (state) {
    case 0:
      return '未激活'
    case 1:
      return '在线'
    case 2:
      return '离线'
    default:
      return '未知'
  }
}

const getDeviceStatusTag = (state?: number) => {
  switch (state) {
    case 0:
      return 'info'
    case 1:
      return 'success'
    case 2:
      return 'danger'
    default:
      return 'info'
  }
}

// TODO @puhui999：注释风格哈
// 事件处理
const handleProductChange = async (productId?: number) => {
  localProductId.value = productId
  localDeviceId.value = undefined
  deviceList.value = []
  if (productId) {
    await getDeviceList(productId)
  }
  emitChange()
}

const handleDeviceChange = (deviceId?: number) => {
  localDeviceId.value = deviceId
  emitChange()
}

const handleDeviceSelectionModeChange = (mode: 'specific' | 'all') => {
  deviceSelectionMode.value = mode
  if (mode === 'all') {
    // 全部设备时，设备 ID 设为 0
    localDeviceId.value = 0
  } else {
    // 选择设备时，清空设备 ID
    localDeviceId.value = undefined
  }
  emitChange()
}

const emitChange = () => {
  emit('change', {
    productId: localProductId.value,
    deviceId: localDeviceId.value
  })
}

// API 调用
const getProductList = async () => {
  productLoading.value = true
  try {
    const data = await ProductApi.getSimpleProductList()
    productList.value = data || []
  } catch (error) {
    console.error('获取产品列表失败:', error)
    // 模拟数据
    // TODO @puhui999：移除下，不太合理
    productList.value = [
      { id: 1, name: '智能温度传感器', productKey: 'temp_sensor_001', status: 0 },
      { id: 2, name: '智能空调控制器', productKey: 'ac_controller_001', status: 0 },
      { id: 3, name: '智能门锁', productKey: 'smart_lock_001', status: 0 }
    ]
  } finally {
    productLoading.value = false
  }
}

const getDeviceList = async (productId: number) => {
  deviceLoading.value = true
  try {
    const data = await DeviceApi.getSimpleDeviceList(undefined, productId)
    deviceList.value = data || []
  } catch (error) {
    console.error('获取设备列表失败:', error)
    // 模拟数据
    // TODO @puhui999：移除下，不太合理
    deviceList.value = [
      { id: 1, deviceName: 'sensor_001', nickname: '客厅温度传感器', state: 1, productId },
      { id: 2, deviceName: 'sensor_002', nickname: '卧室温度传感器', state: 2, productId },
      { id: 3, deviceName: 'sensor_003', nickname: '厨房温度传感器', state: 1, productId }
    ]
  } finally {
    deviceLoading.value = false
  }
}

// 初始化
onMounted(async () => {
  await getProductList()

  // 根据初始设备 ID 设置选择模式
  if (localDeviceId.value === 0) {
    deviceSelectionMode.value = 'all'
  } else if (localDeviceId.value) {
    deviceSelectionMode.value = 'specific'
  }

  if (localProductId.value) {
    await getDeviceList(localProductId.value)
  }
})

// 监听产品变化
watch(
  () => localProductId.value,
  async (newProductId) => {
    if (newProductId && deviceList.value.length === 0) {
      await getDeviceList(newProductId)
    }
  }
)
// TODO @puhui999：是不是 unocss
</script>

<style scoped>
:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
