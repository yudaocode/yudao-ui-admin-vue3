<!-- 设备控制配置组件 -->
<template>
  <div class="device-control-config">
    <!-- 产品和设备选择 -->
    <ProductDeviceSelector
      v-model:product-id="action.productId"
      v-model:device-id="action.deviceId"
      @change="handleDeviceChange"
    />

    <!-- 控制参数配置 -->
    <div v-if="action.productId && action.deviceId" class="control-params">
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
      <div class="params-example">
        <el-alert
          title="参数格式示例"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="example-content">
              <p>属性设置示例：</p>
              <pre><code>{ "temperature": 25, "power": true }</code></pre>
              <p>服务调用示例：</p>
              <pre><code>{ "method": "restart", "params": { "delay": 5 } }</code></pre>
            </div>
          </template>
        </el-alert>
      </div>
    </div>

    <!-- 验证结果 -->
    <div v-if="validationMessage" class="validation-result">
      <el-alert
        :title="validationMessage"
        :type="isValid ? 'success' : 'error'"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import ProductDeviceSelector from '../selectors/ProductDeviceSelector.vue'
import { ActionFormData } from '@/api/iot/rule/scene/scene.types'

/** 设备控制配置组件 */
defineOptions({ name: 'DeviceControlConfig' })

interface Props {
  modelValue: ActionFormData
}

interface Emits {
  (e: 'update:modelValue', value: ActionFormData): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const action = useVModel(props, 'modelValue', emit)

// 状态
const paramsJson = ref('')
const validationMessage = ref('')
const isValid = ref(true)

// 事件处理
const handleDeviceChange = ({ productId, deviceId }: { productId?: number; deviceId?: number }) => {
  action.value.productId = productId
  action.value.deviceId = deviceId
  updateValidationResult()
}

const handleParamsChange = () => {
  try {
    if (paramsJson.value.trim()) {
      action.value.params = JSON.parse(paramsJson.value)
    } else {
      action.value.params = {}
    }
    updateValidationResult()
  } catch (error) {
    isValid.value = false
    validationMessage.value = 'JSON格式错误'
    emit('validate', { valid: false, message: validationMessage.value })
  }
}

const updateValidationResult = () => {
  // 基础验证
  if (!action.value.productId || !action.value.deviceId) {
    isValid.value = false
    validationMessage.value = '请选择产品和设备'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }
  
  if (!action.value.params || Object.keys(action.value.params).length === 0) {
    isValid.value = false
    validationMessage.value = '请配置控制参数'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }
  
  // 验证通过
  isValid.value = true
  validationMessage.value = '设备控制配置验证通过'
  emit('validate', { valid: true, message: validationMessage.value })
}

// 初始化
onMounted(() => {
  if (action.value.params) {
    paramsJson.value = JSON.stringify(action.value.params, null, 2)
  }
  updateValidationResult()
})

// 监听参数变化
watch(() => action.value.params, (newParams) => {
  if (newParams && typeof newParams === 'object') {
    paramsJson.value = JSON.stringify(newParams, null, 2)
  }
}, { deep: true })
</script>

<style scoped>
.device-control-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-params {
  margin-top: 16px;
}

.params-example {
  margin-top: 8px;
}

.example-content pre {
  margin: 4px 0;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
}

.example-content code {
  font-family: 'Courier New', monospace;
  color: var(--el-color-primary);
}

.validation-result {
  margin-top: 8px;
}
</style>
