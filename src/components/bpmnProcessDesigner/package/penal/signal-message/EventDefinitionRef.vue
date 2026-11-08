<template>
  <div class="panel-tab__content">
    <el-alert
      v-if="isMessageThrow"
      type="warning"
      :closable="false"
      title="Flowable 不支持消息中间抛出事件，请改用信号抛出，或者通过服务任务、监听器发送消息"
    />
    <el-form v-else label-width="90px">
      <el-form-item :label="isMessage ? '消息实例' : '信号实例'">
        <el-select
          v-model="bindRefId"
          clearable
          placeholder="可在流程的「消息与信号」中创建"
          @change="updateEventRef"
        >
          <el-option
            v-for="item in refOptions"
            :key="item.id"
            :label="item.name || item.id"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>
<script lang="ts" setup>
defineOptions({ name: 'EventDefinitionRef' })

/**
 * 消息、信号事件引用的消息/信号：支持中间捕获事件（消息、信号）、中间抛出事件（信号）
 *
 * 相关 issue：https://github.com/YunaiV/yudao-cloud/issues/271
 */
const props = defineProps({
  businessObject: Object,
  type: String
})

const isMessage = ref(false) // 是否为消息事件，否则为信号事件
const bindRefId = ref<string>() // 引用的消息/信号编号
const refOptions = ref<Array<{ id: string; name?: string }>>([]) // 可选择的消息/信号

/** 消息中间抛出事件：Flowable 不支持，无法部署 */
const isMessageThrow = computed(() => isMessage.value && props.type === 'IntermediateThrowEvent')

const bpmnInstances = () => (window as any)?.bpmnInstances

const getEventDefinition = () => {
  return bpmnInstances().bpmnElement?.businessObject?.eventDefinitions?.[0]
}

const getRootElements = () => {
  const rootType = isMessage.value ? 'bpmn:Message' : 'bpmn:Signal'
  const rootElements: any[] = bpmnInstances().modeler.getDefinitions().rootElements
  return rootElements.filter((item) => item.$type === rootType)
}

/** 读取事件引用的消息/信号，以及可选择的消息/信号 */
const resetEventRef = () => {
  const eventDefinition = getEventDefinition()
  if (!eventDefinition) {
    return
  }
  isMessage.value = eventDefinition.$type === 'bpmn:MessageEventDefinition'
  bindRefId.value = (isMessage.value ? eventDefinition.messageRef : eventDefinition.signalRef)?.id
  refOptions.value = getRootElements().map((item) => ({ id: item.id, name: item.name }))
}

/** 更新事件引用的消息/信号，清空时移除引用 */
const updateEventRef = (id?: string) => {
  const { bpmnElement, modeling } = bpmnInstances()
  const refElement = getRootElements().find((item) => item.id === id)
  modeling.updateModdleProperties(toRaw(bpmnElement), getEventDefinition(), {
    [isMessage.value ? 'messageRef' : 'signalRef']: refElement
  })
}

watch(
  () => props.businessObject,
  () => {
    nextTick(() => {
      resetEventRef()
    })
  },
  { immediate: true }
)
</script>
