<template>
  <div>
    <el-divider content-position="left">审批人超时未处理时</el-divider>
    <el-form-item label="启用开关" prop="timeoutHandlerEnable">
      <el-switch
        v-model="timeoutHandlerEnable"
        active-text="开启"
        inactive-text="关闭"
        @change="timeoutHandlerChange"
      />
    </el-form-item>
    <el-form-item label="执行动作" prop="timeoutHandlerType" v-if="timeoutHandlerEnable">
      <el-radio-group v-model="timeoutHandlerType.value" @change="onTimeoutHandlerTypeChanged">
        <el-radio-button
          v-for="item in TIMEOUT_HANDLER_TYPES"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        />
      </el-radio-group>
    </el-form-item>
    <el-form-item label="超时时间设置" v-if="timeoutHandlerEnable">
      <span class="mr-2">当超过</span>
      <el-form-item prop="timeDuration">
        <el-input-number
          class="mr-2"
          :style="{ width: '100px' }"
          v-model="timeDuration"
          :min="1"
          controls-position="right"
          @change="
            () => {
              updateTimeModdle()
              updateElementExtensions()
            }
          "
        />
      </el-form-item>
      <el-select
        v-model="timeUnit"
        class="mr-2"
        :style="{ width: '100px' }"
        @change="onTimeUnitChange"
      >
        <el-option
          v-for="item in TIME_UNIT_TYPES"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      未处理
    </el-form-item>
    <el-form-item
      label="最大提醒次数"
      prop="maxRemindCount"
      v-if="timeoutHandlerEnable && timeoutHandlerType.value === 1"
    >
      <el-input-number
        v-model="maxRemindCount"
        :min="1"
        :max="10"
        @change="
          () => {
            updateTimeModdle()
            updateElementExtensions()
          }
        "
      />
    </el-form-item>
  </div>
</template>

<script lang="ts" setup>
import {
  TimeUnitType,
  TIME_UNIT_TYPES,
  TIMEOUT_HANDLER_TYPES
} from '@/components/SimpleProcessDesignerV2/src/consts'
import { convertTimeUnit } from '@/components/SimpleProcessDesignerV2/src/utils'

defineOptions({ name: 'ElementCustomConfig4BoundaryEventTimer' })
const props = defineProps({
  id: String,
  type: String
})
const prefix = inject('prefix')

const bpmnElement = ref()
const bpmnInstances = () => (window as any)?.bpmnInstances

const timeoutHandlerEnable = ref(false)
const boundaryEventType = ref()
const timeoutHandlerType = ref({
  value: undefined
})
const timeModdle = ref()
const timeDuration = ref(6)
const timeUnit = ref(TimeUnitType.HOUR)
const maxRemindCount = ref(1)

const elExtensionElements = ref()
const otherExtensions = ref()
const configExtensions = ref([])
const eventDefinition = ref()

const resetElement = () => {
  bpmnElement.value = bpmnInstances().bpmnElement
  eventDefinition.value = bpmnElement.value.businessObject.eventDefinitions[0]

  // 获取元素扩展属性 或者 创建扩展属性
  elExtensionElements.value =
    bpmnElement.value.businessObject?.extensionElements ??
    bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] })

  // 是否开启自定义用户任务超时处理
  boundaryEventType.value = elExtensionElements.value.values?.filter(
    (ex) => ex.$type === `${prefix}:BoundaryEventType`
  )?.[0]
  if (boundaryEventType.value && boundaryEventType.value.value === 1) {
    timeoutHandlerEnable.value = true
    configExtensions.value.push(boundaryEventType.value)
  }

  // 执行动作
  timeoutHandlerType.value = elExtensionElements.value.values?.filter(
    (ex) => ex.$type === `${prefix}:TimeoutHandlerType`
  )?.[0]
  if (timeoutHandlerType.value) {
    configExtensions.value.push(timeoutHandlerType.value)
    if (eventDefinition.value.timeCycle) {
      const timeStr = eventDefinition.value.timeCycle.body
      const maxRemindCountStr = timeStr.split('/')[0]
      const timeDurationStr = timeStr.split('/')[1]
      console.log(maxRemindCountStr)
      maxRemindCount.value = parseInt(maxRemindCountStr.slice(1))
      timeDuration.value = parseInt(timeDurationStr.slice(2, timeDurationStr.length - 1))
      timeUnit.value = convertTimeUnit(timeDurationStr.slice(timeDurationStr.length - 1))
      timeModdle.value = eventDefinition.value.timeCycle
    }
    if (eventDefinition.value.timeDuration) {
      const timeDurationStr = eventDefinition.value.timeDuration.body
      timeDuration.value = parseInt(timeDurationStr.slice(2, timeDurationStr.length - 1))
      timeUnit.value = convertTimeUnit(timeDurationStr.slice(timeDurationStr.length - 1))
      timeModdle.value = eventDefinition.value.timeDuration
    }
  }

  // 保留剩余扩展元素，便于后面更新该元素对应属性
  otherExtensions.value =
    elExtensionElements.value.values?.filter(
      (ex) =>
        ex.$type !== `${prefix}:BoundaryEventType` && ex.$type !== `${prefix}:TimeoutHandlerType`
    ) ?? []
}

const timeoutHandlerChange = (val) => {
  timeoutHandlerEnable.value = val
  if (val) {
    // 启用自定义用户任务超时处理
    // 边界事件类型 --- 超时
    boundaryEventType.value = bpmnInstances().moddle.create(`${prefix}:BoundaryEventType`, {
      value: 1
    })
    configExtensions.value.push(boundaryEventType.value)
    // 超时处理类型
    timeoutHandlerType.value = bpmnInstances().moddle.create(`${prefix}:TimeoutHandlerType`, {
      value: 1
    })
    configExtensions.value.push(timeoutHandlerType.value)
    // 超时时间表达式
    timeDuration.value = 6
    timeUnit.value = 2
    maxRemindCount.value = 1
    timeModdle.value = bpmnInstances().moddle.create(`bpmn:Expression`, {
      body: 'PT6H'
    })
    eventDefinition.value.timeDuration = timeModdle.value
  } else {
    // 关闭自定义用户任务超时处理
    configExtensions.value = []
    delete eventDefinition.value.timeDuration
    delete eventDefinition.value.timeCycle
  }
  updateElementExtensions()
}

const onTimeoutHandlerTypeChanged = () => {
  maxRemindCount.value = 1
  updateElementExtensions()
  updateTimeModdle()
}

const onTimeUnitChange = () => {
  // 分钟，默认是 60 分钟
  if (timeUnit.value === TimeUnitType.MINUTE) {
    timeDuration.value = 60
  }
  // 小时，默认是 6 个小时
  if (timeUnit.value === TimeUnitType.HOUR) {
    timeDuration.value = 6
  }
  // 天， 默认 1天
  if (timeUnit.value === TimeUnitType.DAY) {
    timeDuration.value = 1
  }
  updateTimeModdle()
  updateElementExtensions()
}

const updateTimeModdle = () => {
  if (maxRemindCount.value > 1) {
    timeModdle.value.body = 'R' + maxRemindCount.value + '/' + isoTimeDuration()
    if (!eventDefinition.value.timeCycle) {
      delete eventDefinition.value.timeDuration
      eventDefinition.value.timeCycle = timeModdle.value
    }
  } else {
    timeModdle.value.body = isoTimeDuration()
    if (!eventDefinition.value.timeDuration) {
      delete eventDefinition.value.timeCycle
      eventDefinition.value.timeDuration = timeModdle.value
    }
  }
}

const isoTimeDuration = () => {
  let strTimeDuration = 'PT'
  if (timeUnit.value === TimeUnitType.MINUTE) {
    strTimeDuration += timeDuration.value + 'M'
  }
  if (timeUnit.value === TimeUnitType.HOUR) {
    strTimeDuration += timeDuration.value + 'H'
  }
  if (timeUnit.value === TimeUnitType.DAY) {
    strTimeDuration += timeDuration.value + 'D'
  }
  return strTimeDuration
}

const updateElementExtensions = () => {
  const extensions = bpmnInstances().moddle.create('bpmn:ExtensionElements', {
    values: [...otherExtensions.value, ...configExtensions.value]
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
        resetElement()
      })
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped></style>
