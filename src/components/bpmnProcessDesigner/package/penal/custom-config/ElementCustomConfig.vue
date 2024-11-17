<template>
  <div class="panel-tab__content">
    <el-divider content-position="left">审批人与提交人为同一人时</el-divider>
    <el-radio-group v-model="assignStartUserHandlerType" @change="updateAssignStartUserHandlerType">
      <div class="flex-col">
        <div v-for="(item, index) in ASSIGN_START_USER_HANDLER_TYPES" :key="index">
          <el-radio :key="item.value" :value="item.value" :label="item.label" />
        </div>
      </div>
    </el-radio-group>
  </div>
</template>

<script lang="ts" setup>
import { ASSIGN_START_USER_HANDLER_TYPES } from '../../../../SimpleProcessDesignerV2/src/consts'

defineOptions({ name: 'ElementCustomConfig' })
const props = defineProps({
  id: String,
  type: String
})
const prefix = inject('prefix')

const elExtensionElements = ref()
const assignStartUserHandlerTypeEl = ref()
const assignStartUserHandlerType = ref()
const otherExtensions = ref()
const bpmnElement = ref()
const bpmnInstances = () => (window as any)?.bpmnInstances

const resetAttributesList = () => {
  bpmnElement.value = bpmnInstances().bpmnElement

  // 获取元素扩展属性 或者 创建扩展属性
  elExtensionElements.value =
    bpmnElement.value.businessObject?.extensionElements ??
    bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] })

  assignStartUserHandlerTypeEl.value =
    elExtensionElements.value.values?.filter(
      (ex) => ex.$type === `${prefix}:AssignStartUserHandlerType`
    )?.[0] || bpmnInstances().moddle.create(`${prefix}:AssignStartUserHandlerType`, { value: 1 })
  assignStartUserHandlerType.value = assignStartUserHandlerTypeEl.value.value

  // 保留剩余扩展元素，便于后面更新该元素对应属性
  otherExtensions.value =
    elExtensionElements.value.values?.filter(
      (ex) => ex.$type !== `${prefix}:AssignStartUserHandlerType`
    ) ?? []

  // 更新元素扩展属性，避免后续报错
  updateElementExtensions()
}

const updateAssignStartUserHandlerType = () => {
  assignStartUserHandlerTypeEl.value.value = assignStartUserHandlerType.value

  updateElementExtensions()
}

const updateElementExtensions = (properties) => {
  const extensions = bpmnInstances().moddle.create('bpmn:ExtensionElements', {
    values: otherExtensions.value.concat([assignStartUserHandlerTypeEl.value])
  })
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    extensionElements: extensions
  })
}

watch(
  () => props.id,
  (val) => {
    val &&
      val.length &&
      nextTick(() => {
        resetAttributesList()
      })
  },
  { immediate: true }
)
</script>
