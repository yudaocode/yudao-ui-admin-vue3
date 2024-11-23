<!-- UserTask 自定义配置：
     1. 审批人与提交人为同一人时
     2. 审批人拒绝时
     3. 审批人为空时
-->
<template>
  <div class="panel-tab__content">
    <el-divider content-position="left">审批人拒绝时</el-divider>
    <el-form-item prop="rejectHandlerType">
      <el-radio-group
        v-model="rejectHandlerType"
        :disabled="returnTaskList.length === 0"
        @change="updateRejectHandlerType"
      >
        <div class="flex-col">
          <div v-for="(item, index) in REJECT_HANDLER_TYPES" :key="index">
            <el-radio :key="item.value" :value="item.value" :label="item.label" />
          </div>
        </div>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-if="rejectHandlerType == RejectHandlerType.RETURN_USER_TASK"
      label="驳回节点"
      prop="returnNodeId"
    >
      <el-select v-model="returnNodeId" clearable style="width: 100%" @change="updateReturnNodeId">
        <el-option
          v-for="item in returnTaskList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>

    <el-divider content-position="left">审批人为空时</el-divider>
    <el-form-item prop="assignEmptyHandlerType">
      <el-radio-group v-model="assignEmptyHandlerType" @change="updateAssignEmptyHandlerType">
        <div class="flex-col">
          <div v-for="(item, index) in ASSIGN_EMPTY_HANDLER_TYPES" :key="index">
            <el-radio :key="item.value" :value="item.value" :label="item.label" />
          </div>
        </div>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-if="assignEmptyHandlerType == AssignEmptyHandlerType.ASSIGN_USER"
      label="指定用户"
      prop="assignEmptyHandlerUserIds"
      span="24"
    >
      <el-select
        v-model="assignEmptyUserIds"
        clearable
        multiple
        style="width: 100%"
        @change="updateAssignEmptyUserIds"
      >
        <el-option
          v-for="item in userOptions"
          :key="item.id"
          :label="item.nickname"
          :value="item.id"
        />
      </el-select>
    </el-form-item>

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
import {
  ASSIGN_START_USER_HANDLER_TYPES,
  RejectHandlerType,
  REJECT_HANDLER_TYPES,
  ASSIGN_EMPTY_HANDLER_TYPES,
  AssignEmptyHandlerType
} from '@/components/SimpleProcessDesignerV2/src/consts'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'ElementCustomConfig' })
const props = defineProps({
  id: String,
  type: String
})
const prefix = inject('prefix')

// 审批人与提交人为同一人时
const assignStartUserHandlerTypeEl = ref()
const assignStartUserHandlerType = ref()

// 审批人拒绝时
const rejectHandlerTypeEl = ref()
const rejectHandlerType = ref()
const returnNodeIdEl = ref()
const returnNodeId = ref()
const returnTaskList = ref([])

// 审批人为空时
const assignEmptyHandlerTypeEl = ref()
const assignEmptyHandlerType = ref()
const assignEmptyUserIdsEl = ref()
const assignEmptyUserIds = ref()

const elExtensionElements = ref()
const otherExtensions = ref()
const bpmnElement = ref()
const bpmnInstances = () => (window as any)?.bpmnInstances

const resetCustomConfigList = () => {
  bpmnElement.value = bpmnInstances().bpmnElement

  // 获取可回退的列表
  returnTaskList.value = findAllPredecessorsExcludingStart(
    bpmnElement.value.id,
    bpmnInstances().modeler
  )

  // 获取元素扩展属性 或者 创建扩展属性
  elExtensionElements.value =
    bpmnElement.value.businessObject?.extensionElements ??
    bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] })

  // 审批人与提交人为同一人时
  assignStartUserHandlerTypeEl.value =
    elExtensionElements.value.values?.filter(
      (ex) => ex.$type === `${prefix}:AssignStartUserHandlerType`
    )?.[0] || bpmnInstances().moddle.create(`${prefix}:AssignStartUserHandlerType`, { value: 1 })
  assignStartUserHandlerType.value = assignStartUserHandlerTypeEl.value.value

  // 审批人拒绝时
  rejectHandlerTypeEl.value =
    elExtensionElements.value.values?.filter(
      (ex) => ex.$type === `${prefix}:RejectHandlerType`
    )?.[0] || bpmnInstances().moddle.create(`${prefix}:RejectHandlerType`, { value: 1 })
  rejectHandlerType.value = rejectHandlerTypeEl.value.value
  returnNodeIdEl.value =
    elExtensionElements.value.values?.filter(
      (ex) => ex.$type === `${prefix}:RejectReturnTaskId`
    )?.[0] || bpmnInstances().moddle.create(`${prefix}:RejectReturnTaskId`, { value: '' })
  returnNodeId.value = returnNodeIdEl.value.value

  // 审批人为空时
  assignEmptyHandlerTypeEl.value =
    elExtensionElements.value.values?.filter(
      (ex) => ex.$type === `${prefix}:AssignEmptyHandlerType`
    )?.[0] || bpmnInstances().moddle.create(`${prefix}:AssignEmptyHandlerType`, { value: 1 })
  assignEmptyHandlerType.value = assignEmptyHandlerTypeEl.value.value
  assignEmptyUserIdsEl.value =
    elExtensionElements.value.values?.filter(
      (ex) => ex.$type === `${prefix}:AssignEmptyUserIds`
    )?.[0] || bpmnInstances().moddle.create(`${prefix}:AssignEmptyUserIds`, { value: '' })
  assignEmptyUserIds.value = assignEmptyUserIdsEl.value.value.split(',').map((item) => {
    // 如果数字超出了最大安全整数范围，则将其作为字符串处理
    let num = Number(item)
    return num > Number.MAX_SAFE_INTEGER || num < -Number.MAX_SAFE_INTEGER ? item : num
  })

  // 保留剩余扩展元素，便于后面更新该元素对应属性
  otherExtensions.value =
    elExtensionElements.value.values?.filter(
      (ex) =>
        ex.$type !== `${prefix}:AssignStartUserHandlerType` &&
        ex.$type !== `${prefix}:RejectHandlerType` &&
        ex.$type !== `${prefix}:RejectReturnTaskId` &&
        ex.$type !== `${prefix}:AssignEmptyHandlerType` &&
        ex.$type !== `${prefix}:AssignEmptyUserIds`
    ) ?? []

  // 更新元素扩展属性，避免后续报错
  updateElementExtensions()
}

const updateAssignStartUserHandlerType = () => {
  assignStartUserHandlerTypeEl.value.value = assignStartUserHandlerType.value

  updateElementExtensions()
}

const updateRejectHandlerType = () => {
  rejectHandlerTypeEl.value.value = rejectHandlerType.value

  returnNodeId.value = returnTaskList.value[0].id
  returnNodeIdEl.value.value = returnNodeId.value

  updateElementExtensions()
}

const updateReturnNodeId = () => {
  returnNodeIdEl.value.value = returnNodeId.value

  updateElementExtensions()
}

const updateAssignEmptyHandlerType = () => {
  assignEmptyHandlerTypeEl.value.value = assignEmptyHandlerType.value

  updateElementExtensions()
}

const updateAssignEmptyUserIds = () => {
  assignEmptyUserIdsEl.value.value = assignEmptyUserIds.value.toString()

  updateElementExtensions()
}

const updateElementExtensions = () => {
  const extensions = bpmnInstances().moddle.create('bpmn:ExtensionElements', {
    values: [
      ...otherExtensions.value,
      assignStartUserHandlerTypeEl.value,
      rejectHandlerTypeEl.value,
      returnNodeIdEl.value,
      assignEmptyHandlerTypeEl.value,
      assignEmptyUserIdsEl.value
    ]
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
        resetCustomConfigList()
      })
  },
  { immediate: true }
)

function findAllPredecessorsExcludingStart(elementId, modeler) {
  const elementRegistry = modeler.get('elementRegistry')
  const allConnections = elementRegistry.filter((element) => element.type === 'bpmn:SequenceFlow')
  const predecessors = new Set() // 使用 Set 来避免重复节点

  // 检查是否是开始事件节点
  function isStartEvent(element) {
    return element.type === 'bpmn:StartEvent'
  }

  function findPredecessorsRecursively(element) {
    // 获取与当前节点相连的所有连接
    const incomingConnections = allConnections.filter((connection) => connection.target === element)

    incomingConnections.forEach((connection) => {
      const source = connection.source // 获取前置节点

      // 只添加不是开始事件的前置节点
      if (!isStartEvent(source)) {
        predecessors.add(source.businessObject)
        // 递归查找前置节点
        findPredecessorsRecursively(source)
      }
    })
  }

  const targetElement = elementRegistry.get(elementId)
  if (targetElement) {
    findPredecessorsRecursively(targetElement)
  }

  return Array.from(predecessors) // 返回前置节点数组
}

const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
onMounted(async () => {
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
})
</script>
