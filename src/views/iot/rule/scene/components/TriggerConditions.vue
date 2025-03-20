<template>
  <div class="trigger-conditions">
    <div class="conditions-header mb-3">
      <el-button type="primary" @click="addCondition" :disabled="!productKey">
        <Icon icon="ep:plus" class="mr-5px" /> 添加条件
      </el-button>
      <div class="conditions-tips" v-if="modelValue && modelValue.length > 0">
        注：多个条件之间为"或"关系
      </div>
    </div>

    <el-empty v-if="!modelValue || modelValue.length === 0" description="暂无触发条件" />

    <div class="conditions-list" v-else>
      <div v-for="(condition, index) in modelValue" :key="index" class="condition-item mb-3">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>条件 {{ index + 1 }}</span>
              <el-button type="danger" link @click="removeCondition(index)"> 删除 </el-button>
            </div>
          </template>
          <div class="condition-content">
            <el-form label-width="100px" :model="condition">
              <el-form-item label="消息类型">
                <el-select
                  v-model="condition.type"
                  placeholder="请选择消息类型"
                  @change="handleMessageTypeChange(index)"
                >
                  <el-option label="属性上报" :value="IotDeviceMessageTypeEnum.PROPERTY" />
                  <el-option label="事件上报" :value="IotDeviceMessageTypeEnum.EVENT" />
                </el-select>
              </el-form-item>
              <el-form-item label="消息标识符">
                <el-select
                  v-model="condition.identifier"
                  placeholder="请选择消息标识符"
                  filterable
                  :loading="thingModelLoading"
                  @change="handleIdentifierChange(index)"
                >
                  <el-option
                    v-for="item in getThingModelOptions(condition.type)"
                    :key="item.identifier"
                    :label="item.name"
                    :value="item.identifier"
                  >
                    <div class="thing-model-option">
                      <span>{{ item.name }}</span>
                      <span class="thing-model-identifier">{{ item.identifier }}</span>
                    </div>
                    <div class="thing-model-desc" v-if="item.description">{{
                      item.description
                    }}</div>
                  </el-option>
                </el-select>
              </el-form-item>

              <div class="parameters-area mt-3 mb-2">
                <div class="parameters-header">
                  <div>参数列表（多个参数之间为"或"关系）</div>
                  <el-button type="primary" link @click="addParameter(index)"> 添加参数 </el-button>
                </div>

                <el-empty
                  v-if="!condition.parameters || condition.parameters.length === 0"
                  description="暂无参数"
                />

                <div class="parameters-list mt-2" v-else>
                  <div
                    v-for="(param, pIndex) in condition.parameters"
                    :key="pIndex"
                    class="parameter-item mb-2"
                  >
                    <el-card shadow="hover">
                      <div class="parameter-item-header">
                        <span>参数 {{ pIndex + 1 }}</span>
                        <el-button type="danger" link @click="removeParameter(index, pIndex)">
                          删除
                        </el-button>
                      </div>

                      <el-form label-width="90px" :model="param" class="mt-2">
                        <el-form-item label="标识符">
                          <el-select
                            v-model="param.identifier"
                            placeholder="请选择参数标识符"
                            filterable
                          >
                            <el-option
                              v-for="item in getParameterOptions(condition)"
                              :key="item.identifier"
                              :label="item.name"
                              :value="item.identifier"
                            >
                              <div class="thing-model-option">
                                <span>{{ item.name }}</span>
                                <span class="thing-model-identifier">{{ item.identifier }}</span>
                              </div>
                              <div class="thing-model-desc" v-if="item.description">{{
                                item.description
                              }}</div>
                            </el-option>
                          </el-select>
                        </el-form-item>
                        <el-form-item label="条件">
                          <condition-selector
                            v-model="param.condition"
                            :placeholder="'请选择条件'"
                            :value-placeholder="'请输入比较值'"
                          />
                        </el-form-item>
                      </el-form>
                    </el-card>
                  </div>
                </div>
              </div>
            </el-form>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, onMounted, ref, watch } from 'vue'
import {
  IotDeviceMessageIdentifierEnum,
  IotDeviceMessageTypeEnum,
  IotRuleSceneTriggerCondition,
  IotRuleSceneTriggerConditionParameter
} from '@/api/iot/rule/scene/scene.types'
import { ThingModelApi, ThingModelData } from '@/api/iot/thingmodel'
import ConditionSelector from './ConditionSelector.vue'

const props = defineProps({
  modelValue: {
    type: Array as () => IotRuleSceneTriggerCondition[],
    required: true
  },
  productKey: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

// 物模型数据
const thingModelList = ref<ThingModelData[]>([])
const thingModelLoading = ref(false)

// 加载物模型数据
const loadThingModelData = async () => {
  if (!props.productKey) return

  try {
    thingModelLoading.value = true
    const result = await ThingModelApi.getThingModelListByProductId({
      productKey: props.productKey
    })
    thingModelList.value = result || []
  } catch (error) {
    console.error('获取物模型数据失败', error)
  } finally {
    thingModelLoading.value = false
  }
}

// 获取物模型选项
const getThingModelOptions = (type: string) => {
  if (!thingModelList.value) return []

  return thingModelList.value.filter((item) => {
    if (type === IotDeviceMessageTypeEnum.PROPERTY) {
      return item.property
    } else if (type === IotDeviceMessageTypeEnum.EVENT) {
      return item.event
    }
    return false
  })
}

// 获取参数选项
const getParameterOptions = (condition: IotRuleSceneTriggerCondition) => {
  if (!condition || !condition.identifier) return []

  const model = thingModelList.value?.find((item) => item.identifier === condition.identifier)
  if (!model) return []

  if (condition.type === IotDeviceMessageTypeEnum.PROPERTY) {
    return [model] // 属性本身就是参数
  } else if (condition.type === IotDeviceMessageTypeEnum.EVENT) {
    // TODO: 获取事件的输出参数列表
    return []
  }
  return []
}

// 添加条件
const addCondition = () => {
  const newCondition: IotRuleSceneTriggerCondition = {
    type: IotDeviceMessageTypeEnum.PROPERTY,
    identifier: IotDeviceMessageIdentifierEnum.PROPERTY_REPORT,
    parameters: []
  }

  const newValue = [...(props.modelValue || []), newCondition]
  emit('update:modelValue', newValue)
}

// 移除条件
const removeCondition = (index: number) => {
  const newValue = [...props.modelValue]
  newValue.splice(index, 1)
  emit('update:modelValue', newValue)
}

// 消息类型变更
const handleMessageTypeChange = (index: number) => {
  const newValue = [...props.modelValue]
  // 更新标识符
  if (newValue[index].type === IotDeviceMessageTypeEnum.PROPERTY) {
    newValue[index].identifier = IotDeviceMessageIdentifierEnum.PROPERTY_REPORT
  } else if (newValue[index].type === IotDeviceMessageTypeEnum.EVENT) {
    newValue[index].identifier = IotDeviceMessageIdentifierEnum.EVENT_REPORT
  }
  // 清空参数
  newValue[index].parameters = []
  emit('update:modelValue', newValue)
}

// 标识符变更
const handleIdentifierChange = (index: number) => {
  const newValue = [...props.modelValue]
  // 清空参数
  newValue[index].parameters = []
  emit('update:modelValue', newValue)
}

// 添加参数
const addParameter = (conditionIndex: number) => {
  const newValue = [...props.modelValue]
  if (!newValue[conditionIndex].parameters) {
    newValue[conditionIndex].parameters = []
  }

  const newParameter: IotRuleSceneTriggerConditionParameter = {
    identifier: '',
    condition: {
      operator: 'eq',
      value: ''
    }
  }

  newValue[conditionIndex].parameters.push(newParameter)
  emit('update:modelValue', newValue)
}

// 移除参数
const removeParameter = (conditionIndex: number, paramIndex: number) => {
  const newValue = [...props.modelValue]
  newValue[conditionIndex].parameters.splice(paramIndex, 1)
  emit('update:modelValue', newValue)
}

// 监听 productKey 变化
watch(
  () => props.productKey,
  (newVal) => {
    if (!newVal) {
      // 清空条件
      if (props.modelValue?.length > 0) {
        emit('update:modelValue', [])
      }
      // 清空物模型数据
      thingModelList.value = []
    } else {
      // 加载物模型数据
      loadThingModelData()
    }
  }
)

// 初始化
onMounted(() => {
  if (props.productKey) {
    loadThingModelData()
  }
})
</script>

<style scoped>
.trigger-conditions {
  width: 100%;
}

.conditions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conditions-tips {
  font-size: 12px;
  color: #999;
}

.condition-item {
  border-radius: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.parameters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
}

.parameter-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.value-tips {
  margin-top: 5px;
  font-size: 12px;
  color: #999;
}

.thing-model-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.thing-model-identifier {
  font-size: 12px;
  color: #999;
}

.thing-model-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-2 {
  margin-top: 8px;
}

.mr-5px {
  margin-right: 5px;
}
</style>
