<!-- 条件组配置组件 -->
<template>
  <div class="condition-group-config">
    <div class="group-content">
      <!-- 条件列表 -->
      <div v-if="group.conditions && group.conditions.length > 0" class="conditions-list">
        <div
          v-for="(condition, index) in group.conditions"
          :key="`condition-${index}`"
          class="condition-item"
        >
          <div class="condition-header">
            <div class="condition-title">
              <span>条件 {{ index + 1 }}</span>
              <el-tag size="small" type="primary">
                {{ getConditionTypeName(condition.type) }}
              </el-tag>
            </div>
            <el-button
              type="danger"
              size="small"
              text
              @click="removeCondition(index)"
              v-if="group.conditions!.length > 1"
            >
              <Icon icon="ep:delete" />
              删除
            </el-button>
          </div>

          <div class="condition-content">
            <ConditionConfig
              :model-value="condition"
              @update:model-value="(value) => updateCondition(index, value)"
              :trigger-type="triggerType"
              :product-id="productId"
              :device-id="deviceId"
              @validate="(result) => handleConditionValidate(index, result)"
            />
          </div>

          <!-- 逻辑连接符 -->
          <div
            v-if="index < group.conditions!.length - 1"
            class="logic-connector"
          >
            <el-select
              v-model="group.logicOperator"
              size="small"
              style="width: 80px;"
            >
              <el-option label="且" value="AND" />
              <el-option label="或" value="OR" />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-conditions">
        <el-empty description="暂无条件配置" :image-size="80">
          <el-button type="primary" @click="addCondition">
            <Icon icon="ep:plus" />
            添加第一个条件
          </el-button>
        </el-empty>
      </div>

      <!-- 添加条件按钮 -->
      <div v-if="group.conditions && group.conditions.length > 0 && group.conditions.length < maxConditions" class="add-condition">
        <el-button
          type="primary"
          plain
          @click="addCondition"
          class="add-condition-btn"
        >
          <Icon icon="ep:plus" />
          继续添加条件
        </el-button>
        <span class="add-condition-text">
          最多可添加 {{ maxConditions }} 个条件
        </span>
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
import ConditionConfig from './ConditionConfig.vue'
import { 
  ConditionGroupFormData, 
  ConditionFormData,
  IotRuleSceneTriggerTypeEnum 
} from '@/api/iot/rule/scene/scene.types'

/** 条件组配置组件 */
defineOptions({ name: 'ConditionGroupConfig' })

interface Props {
  modelValue: ConditionGroupFormData
  triggerType: number
  productId?: number
  deviceId?: number
}

interface Emits {
  (e: 'update:modelValue', value: ConditionGroupFormData): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const group = useVModel(props, 'modelValue', emit)

// 配置常量
const maxConditions = 5

// 验证状态
const conditionValidations = ref<{ [key: number]: { valid: boolean; message: string } }>({})
const validationMessage = ref('')
const isValid = ref(true)

// 条件类型映射
const conditionTypeNames = {
  [IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST]: '属性条件',
  [IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST]: '事件条件',
  [IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE]: '服务条件'
}

// 工具函数
const getConditionTypeName = (type: number) => {
  return conditionTypeNames[type] || '未知条件'
}

// 事件处理
const updateCondition = (index: number, condition: ConditionFormData) => {
  if (group.value.conditions) {
    group.value.conditions[index] = condition
  }
}

const addCondition = () => {
  if (!group.value.conditions) {
    group.value.conditions = []
  }
  
  if (group.value.conditions.length >= maxConditions) {
    return
  }
  
  const newCondition: ConditionFormData = {
    type: props.triggerType,
    productId: props.productId || 0,
    deviceId: props.deviceId || 0,
    identifier: '',
    operator: '=',
    param: ''
  }
  
  group.value.conditions.push(newCondition)
}

const removeCondition = (index: number) => {
  if (group.value.conditions) {
    group.value.conditions.splice(index, 1)
    delete conditionValidations.value[index]
    
    // 重新索引验证结果
    const newValidations: { [key: number]: { valid: boolean; message: string } } = {}
    Object.keys(conditionValidations.value).forEach(key => {
      const numKey = parseInt(key)
      if (numKey > index) {
        newValidations[numKey - 1] = conditionValidations.value[numKey]
      } else if (numKey < index) {
        newValidations[numKey] = conditionValidations.value[numKey]
      }
    })
    conditionValidations.value = newValidations
    
    updateValidationResult()
  }
}

const handleConditionValidate = (index: number, result: { valid: boolean; message: string }) => {
  conditionValidations.value[index] = result
  updateValidationResult()
}

const updateValidationResult = () => {
  if (!group.value.conditions || group.value.conditions.length === 0) {
    isValid.value = false
    validationMessage.value = '请至少添加一个条件'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }
  
  const validations = Object.values(conditionValidations.value)
  const allValid = validations.every(v => v.valid)
  
  if (allValid) {
    isValid.value = true
    validationMessage.value = '条件组配置验证通过'
  } else {
    isValid.value = false
    const errorMessages = validations
      .filter(v => !v.valid)
      .map(v => v.message)
    validationMessage.value = `条件配置错误: ${errorMessages.join('; ')}`
  }
  
  emit('validate', { valid: isValid.value, message: validationMessage.value })
}

// 监听条件数量变化
watch(() => group.value.conditions?.length, () => {
  updateValidationResult()
})

// 初始化
onMounted(() => {
  if (!group.value.conditions || group.value.conditions.length === 0) {
    addCondition()
  }
})
</script>

<style scoped>
.condition-group-config {
  padding: 16px;
}

.group-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.condition-item {
  position: relative;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.condition-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.condition-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.condition-content {
  padding: 16px;
}

.logic-connector {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  position: relative;
}

.logic-connector::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 100%;
  background: var(--el-border-color);
}

.empty-conditions {
  padding: 40px 0;
  text-align: center;
}

.add-condition {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.add-condition-btn {
  flex-shrink: 0;
}

.add-condition-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.validation-result {
  margin-top: 16px;
}
</style>
