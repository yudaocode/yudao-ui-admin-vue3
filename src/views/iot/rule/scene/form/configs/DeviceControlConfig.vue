<!-- 设备控制配置组件 -->
<!-- TODO @puhui999：貌似没生效~~~ -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 产品和设备选择 -->
    <ProductDeviceSelector
      v-model:product-id="action.productId"
      v-model:device-id="action.deviceId"
      @change="handleDeviceChange"
    />

    <!-- 控制参数配置 -->
    <div v-if="action.productId && action.deviceId" class="space-y-16px">
      <el-form-item label="控制参数" required>
        <el-input
          v-model="paramsJson"
          type="textarea"
          :rows="4"
          placeholder="请输入JSON格式的控制参数"
          @input="handleParamsChange"
        />
      </el-form-item>

      <!-- 参数示例 -->
      <div class="mt-12px">
        <el-alert title="参数格式示例" type="info" :closable="false" show-icon>
          <template #default>
            <div class="space-y-8px">
              <p class="m-0 text-14px text-[var(--el-text-color-primary)]">属性设置示例：</p>
              <pre
                class="m-0 p-8px bg-[var(--el-fill-color-light)] rounded-4px text-12px text-[var(--el-text-color-regular)] overflow-x-auto"
              ><code>{ "temperature": 25, "power": true }</code></pre>
              <p class="m-0 text-14px text-[var(--el-text-color-primary)]">服务调用示例：</p>
              <pre
                class="m-0 p-8px bg-[var(--el-fill-color-light)] rounded-4px text-12px text-[var(--el-text-color-regular)] overflow-x-auto"
              ><code>{ "method": "restart", "params": { "delay": 5 } }</code></pre>
            </div>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import ProductDeviceSelector from '../selectors/ProductDeviceSelector.vue'
import { ActionFormData } from '@/api/iot/rule/scene/scene.types'

/** 设备控制配置组件 */
defineOptions({ name: 'DeviceControlConfig' })

const props = defineProps<{
  modelValue: ActionFormData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ActionFormData): void
}>()

const action = useVModel(props, 'modelValue', emit)

// 状态
const paramsJson = ref('')

// 事件处理
const handleDeviceChange = ({ productId, deviceId }: { productId?: number; deviceId?: number }) => {
  action.value.productId = productId
  action.value.deviceId = deviceId
}

const handleParamsChange = () => {
  try {
    if (paramsJson.value.trim()) {
      action.value.params = JSON.parse(paramsJson.value)
    } else {
      action.value.params = {}
    }
  } catch (error) {
    console.error('JSON格式错误:', error)
  }
}

// 初始化
onMounted(() => {
  if (action.value.params) {
    paramsJson.value = JSON.stringify(action.value.params, null, 2)
  }
})

// 监听参数变化
watch(
  () => action.value.params,
  (newParams) => {
    if (newParams && typeof newParams === 'object') {
      paramsJson.value = JSON.stringify(newParams, null, 2)
    }
  },
  { deep: true }
)
</script>

<style scoped>
:deep(.example-content code) {
  font-family: 'Courier New', monospace;
  color: var(--el-color-primary);
}
</style>
