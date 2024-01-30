<template>
  <!-- 弹窗：流程模型图的预览 -->
  <Dialog v-model="bpmnDetailVisible" :append-to-body="true" title="流程图" width="800">
    <MyProcessViewer
      key="designer"
      v-model="bpmnXML"
      :prefix="bpmnControlForm.prefix"
      :value="bpmnXML as any"
      v-bind="bpmnControlForm"
    />
  </Dialog>
</template>

<script lang="ts" setup>
import * as ModelApi from '@/api/bpm/model'
import { MyProcessViewer } from '@/components/bpmnProcessDesigner/package'

defineOptions({ name: 'BPMLModel' })
/** 流程图的详情按钮操作 */
const bpmnDetailVisible = ref(false)
const bpmnXML = ref(null)
const bpmnControlForm = ref({
  prefix: 'flowable'
})
const handleBpmnDetail = async (key: string) => {
  const data = await ModelApi.getModelByKey(key)
  bpmnXML.value = data.bpmnXml || ''
  bpmnDetailVisible.value = true
}
defineExpose({ handleBpmnDetail })
</script>
