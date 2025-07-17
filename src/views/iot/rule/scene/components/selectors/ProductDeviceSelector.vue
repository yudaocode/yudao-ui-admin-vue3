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
              <div class="product-option">
                <div class="option-content">
                  <div class="option-name">{{ product.name }}</div>
                  <div class="option-key">{{ product.productKey }}</div>
                </div>
                <el-tag size="small" :type="product.status === 0 ? 'success' : 'danger'">
                  {{ product.status === 0 ? '正常' : '禁用' }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>

      <!-- 设备选择模式 -->
      <el-col :span="12">
        <el-form-item label="设备选择模式" required>
          <el-radio-group v-model="deviceSelectionMode" @change="handleDeviceSelectionModeChange">
            <el-radio value="specific">选择设备</el-radio>
            <el-radio value="all">全部设备</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 具体设备选择 -->
    <el-row v-if="deviceSelectionMode === 'specific'" :gutter="16">
      <el-col :span="24">
        <el-form-item label="选择设备" required>
          <el-select
            v-model="localDeviceId"
            placeholder="请先选择产品"
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
              <div class="device-option">
                <div class="option-content">
                  <div class="option-name">{{ device.deviceName }}</div>
                  <div class="option-nickname">{{ device.nickname || '无备注' }}</div>
                </div>
                <el-tag
                  size="small"
                  :type="getDeviceStatusTag(device.state)"
                >
                  {{ getDeviceStatusText(device.state) }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 选择结果展示 -->
    <div v-if="localProductId && (localDeviceId !== undefined)" class="selection-result">
      <div class="result-header">
        <Icon icon="ep:check" class="result-icon" />
        <span class="result-title">已选择设备</span>
      </div>
      <div class="result-content">
        <div class="result-item">
          <span class="result-label">产品：</span>
          <span class="result-value">{{ selectedProduct?.name }}</span>
          <el-tag size="small" type="primary">{{ selectedProduct?.productKey }}</el-tag>
        </div>
        <div class="result-item">
          <span class="result-label">设备：</span>
          <span v-if="deviceSelectionMode === 'all'" class="result-value">全部设备</span>
          <span v-else class="result-value">{{ selectedDevice?.deviceName }}</span>
          <el-tag
            v-if="deviceSelectionMode === 'all'"
            size="small"
            type="warning"
          >
            全部
          </el-tag>
          <el-tag
            v-else
            size="small"
            :type="getDeviceStatusTag(selectedDevice?.state)"
          >
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
const deviceSelectionMode = ref<'specific' | 'all'>('specific')

// 数据状态
const productLoading = ref(false)
const deviceLoading = ref(false)
const productList = ref<any[]>([])
const deviceList = ref<any[]>([])

// 计算属性
const selectedProduct = computed(() => {
  return productList.value.find(p => p.id === localProductId.value)
})

const selectedDevice = computed(() => {
  return deviceList.value.find(d => d.id === localDeviceId.value)
})

// 设备状态映射
const getDeviceStatusText = (state?: number) => {
  switch (state) {
    case 0: return '未激活'
    case 1: return '在线'
    case 2: return '离线'
    default: return '未知'
  }
}

const getDeviceStatusTag = (state?: number) => {
  switch (state) {
    case 0: return 'info'
    case 1: return 'success'
    case 2: return 'danger'
    default: return 'info'
  }
}

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
    // 全部设备时，设备ID设为0
    localDeviceId.value = 0
  } else {
    // 选择设备时，清空设备ID
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

  // 根据初始设备ID设置选择模式
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
watch(() => localProductId.value, async (newProductId) => {
  if (newProductId && deviceList.value.length === 0) {
    await getDeviceList(newProductId)
  }
})
</script>

<style scoped>
.product-device-selector {
  width: 100%;
}

.product-option,
.device-option {
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

.option-key,
.option-nickname {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.selection-result {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.result-icon {
  color: var(--el-color-success);
  font-size: 16px;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 22px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 40px;
}

.result-value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
