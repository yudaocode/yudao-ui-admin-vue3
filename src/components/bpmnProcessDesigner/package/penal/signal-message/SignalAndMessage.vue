<template>
  <div class="panel-tab__content">
    <div class="panel-tab__content--title">
      <span><Icon icon="ep:menu" style="margin-right: 8px; color: #555" />{{ $t('bpm.design.messageList') }}</span>
      <XButton type="primary" :title="$t('bpm.design.createNewMessage')" preIcon="ep:plus" @click="openModel('message')" />
    </div>
    <el-table :data="messageList" border>
      <el-table-column type="index" :label="$t('bpm.design.serialNumber')" width="60px" />
      <el-table-column :label="$t('bpm.design.messageId')" prop="id" max-width="300px" show-overflow-tooltip />
      <el-table-column :label="$t('bpm.design.messageName')" prop="name" max-width="300px" show-overflow-tooltip />
    </el-table>
    <div
      class="panel-tab__content--title"
      style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #eee"
    >
      <span><Icon icon="ep:menu" style="margin-right: 8px; color: #555" />{{ $t('bpm.design.signalList') }}</span>
      <XButton type="primary" :title="$t('bpm.design.createNewSignal')" preIcon="ep:plus" @click="openModel('signal')" />
    </div>
    <el-table :data="signalList" border>
      <el-table-column type="index" :label="$t('bpm.design.serialNumber')" width="60px" />
      <el-table-column :label="$t('bpm.design.signalId')" prop="id" max-width="300px" show-overflow-tooltip />
      <el-table-column :label="$t('bpm.design.signalName')" prop="name" max-width="300px" show-overflow-tooltip />
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="modelConfig.title"
      :close-on-click-modal="false"
      width="400px"
      append-to-body
      destroy-on-close
    >
      <el-form :model="modelObjectForm" label-width="90px">
        <el-form-item :label="modelConfig.idLabel">
          <el-input v-model="modelObjectForm.id" clearable />
        </el-form-item>
        <el-form-item :label="modelConfig.nameLabel">
          <el-input v-model="modelObjectForm.name" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('bpm.design.cancel') }}</el-button>
        <el-button type="primary" @click="addNewObject">{{ $t('bpm.design.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
defineOptions({ name: 'SignalAndMassage' })
const { t } = useI18n()
const message = useMessage()
const signalList = ref<any[]>([])
const messageList = ref<any[]>([])
const dialogVisible = ref(false)
const modelType = ref('')
const modelObjectForm = ref<any>({})
const rootElements = ref()
const messageIdMap = ref()
const signalIdMap = ref()
const modelConfig = computed(() => {
  if (modelType.value === 'message') {
    return { title: t('bpm.design.createMessage'), idLabel: t('bpm.design.messageId'), nameLabel: t('bpm.design.messageName') }
  } else {
    return { title: t('bpm.design.createSignal'), idLabel: t('bpm.design.signalId'), nameLabel: t('bpm.design.signalName') }
  }
})
const bpmnInstances = () => (window as any)?.bpmnInstances

const initDataList = () => {
  console.log(window, 'window')
  rootElements.value = bpmnInstances().modeler.getDefinitions().rootElements
  messageIdMap.value = {}
  signalIdMap.value = {}
  messageList.value = []
  signalList.value = []
  rootElements.value.forEach((el) => {
    if (el.$type === 'bpmn:Message') {
      messageIdMap.value[el.id] = true
      messageList.value.push({ ...el })
    }
    if (el.$type === 'bpmn:Signal') {
      signalIdMap.value[el.id] = true
      signalList.value.push({ ...el })
    }
  })
}
const openModel = (type) => {
  modelType.value = type
  modelObjectForm.value = {}
  dialogVisible.value = true
}
const addNewObject = () => {
  if (modelType.value === 'message') {
    if (messageIdMap.value[modelObjectForm.value.id]) {
      message.error(t('bpm.design.messageExists'))
    }
    const messageRef = bpmnInstances().moddle.create('bpmn:Message', modelObjectForm.value)
    rootElements.value.push(messageRef)
  } else {
    if (signalIdMap.value[modelObjectForm.value.id]) {
      message.error(t('bpm.design.signalExists'))
    }
    const signalRef = bpmnInstances().moddle.create('bpmn:Signal', modelObjectForm.value)
    rootElements.value.push(signalRef)
  }
  dialogVisible.value = false
  initDataList()
}

onMounted(() => {
  initDataList()
})
</script>
