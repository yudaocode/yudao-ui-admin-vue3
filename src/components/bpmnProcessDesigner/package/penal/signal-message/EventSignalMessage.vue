<template>
  <div class="panel-tab__content">
    <div v-if="eventType === 'message'" style="margin-top: 10px">
      <el-form label-width="90px">
        <el-form-item label="选择消息">
          <el-select
            v-model="selectedMessageId"
            placeholder="请选择消息"
            style="width: 100%"
            @change="updateMessageEvent"
          >
            <el-option
              v-for="msg in messageList"
              :key="msg.id"
              :label="msg.name || msg.id"
              :value="msg.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <el-alert
        v-if="messageList.length === 0"
        title="暂无可用消息"
        type="warning"
        description="请先在流程的"消息与信号"面板中创建消息"
        show-icon
        :closable="false"
      />
    </div>

    <div v-if="eventType === 'signal'" style="margin-top: 10px">
      <el-form label-width="90px">
        <el-form-item label="选择信号">
          <el-select
            v-model="selectedSignalId"
            placeholder="请选择信号"
            style="width: 100%"
            @change="updateSignalEvent"
          >
            <el-option
              v-for="sig in signalList"
              :key="sig.id"
              :label="sig.name || sig.id"
              :value="sig.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <el-alert
        v-if="signalList.length === 0"
        title="暂无可用信号"
        type="warning"
        description="请先在流程的"消息与信号"面板中创建信号"
        show-icon
        :closable="false"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue'

defineOptions({ name: 'EventSignalMessage' })

const props = defineProps({
  businessObject: Object,
  elementId: String
})

const bpmnInstances = () => (window as any)?.bpmnInstances

const messageList = ref<any[]>([])
const signalList = ref<any[]>([])
const selectedMessageId = ref('')
const selectedSignalId = ref('')
const eventType = ref<'message' | 'signal' | null>(null)

// 检测当前事件类型（消息事件还是信号事件）
const detectEventType = () => {
  if (!props.businessObject) return null

  const eventDefinitions = props.businessObject.eventDefinitions || []
  if (eventDefinitions.length === 0) return null

  const eventDef = eventDefinitions[0]
  if (eventDef.$type === 'bpmn:MessageEventDefinition') {
    return 'message'
  } else if (eventDef.$type === 'bpmn:SignalEventDefinition') {
    return 'signal'
  }
  return null
}

// 初始化消息和信号列表
const initLists = () => {
  if (!bpmnInstances()?.modeler) return

  const rootElements = bpmnInstances().modeler.getDefinitions().rootElements
  messageList.value = []
  signalList.value = []

  rootElements.forEach((el) => {
    if (el.$type === 'bpmn:Message') {
      messageList.value.push({ ...el })
    }
    if (el.$type === 'bpmn:Signal') {
      signalList.value.push({ ...el })
    }
  })
}

// 从当前元素同步选中的消息或信号
const syncFromBusinessObject = () => {
  eventType.value = detectEventType()
  if (!eventType.value) return

  const eventDefinitions = props.businessObject?.eventDefinitions || []
  if (eventDefinitions.length === 0) return

  const eventDef = eventDefinitions[0]

  if (eventType.value === 'message' && eventDef.messageRef) {
    selectedMessageId.value = eventDef.messageRef.id || ''
  } else if (eventType.value === 'signal' && eventDef.signalRef) {
    selectedSignalId.value = eventDef.signalRef.id || ''
  }
}

// 更新消息事件
const updateMessageEvent = () => {
  if (!bpmnInstances()?.modeling || !props.elementId) return

  const element = bpmnInstances().elementRegistry.get(props.elementId)
  if (!element) return

  const selectedMessage = messageList.value.find((m) => m.id === selectedMessageId.value)
  if (!selectedMessage) return

  // 获取或创建 MessageEventDefinition
  let eventDefinitions = element.businessObject.eventDefinitions || []
  let messageDef = eventDefinitions[0]

  if (!messageDef || messageDef.$type !== 'bpmn:MessageEventDefinition') {
    messageDef = bpmnInstances().bpmnFactory.create('bpmn:MessageEventDefinition', {})
    eventDefinitions = [messageDef]
  }

  // 更新 messageRef
  messageDef.messageRef = selectedMessage

  bpmnInstances().modeling.updateProperties(element, {
    eventDefinitions: eventDefinitions
  })
}

// 更新信号事件
const updateSignalEvent = () => {
  if (!bpmnInstances()?.modeling || !props.elementId) return

  const element = bpmnInstances().elementRegistry.get(props.elementId)
  if (!element) return

  const selectedSignal = signalList.value.find((s) => s.id === selectedSignalId.value)
  if (!selectedSignal) return

  // 获取或创建 SignalEventDefinition
  let eventDefinitions = element.businessObject.eventDefinitions || []
  let signalDef = eventDefinitions[0]

  if (!signalDef || signalDef.$type !== 'bpmn:SignalEventDefinition') {
    signalDef = bpmnInstances().bpmnFactory.create('bpmn:SignalEventDefinition', {})
    eventDefinitions = [signalDef]
  }

  // 更新 signalRef
  signalDef.signalRef = selectedSignal

  bpmnInstances().modeling.updateProperties(element, {
    eventDefinitions: eventDefinitions
  })
}

onMounted(() => {
  initLists()
  syncFromBusinessObject()
})

watch(
  () => props.businessObject,
  () => {
    initLists()
    syncFromBusinessObject()
  },
  { immediate: true, deep: true }
)

watch(
  () => props.elementId,
  () => {
    syncFromBusinessObject()
  }
)
</script>

<style scoped>
.panel-tab__content {
  padding: 10px;
}
</style>
