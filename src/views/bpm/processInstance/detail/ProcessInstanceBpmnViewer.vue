<template>
  <el-card v-loading="loading" class="box-card">
    <template #header>
      <span class="el-icon-picture-outline">流程图</span>
    </template>
    <MyProcessViewer key="designer" :xml="view.bpmnXml" :view="view" class="h-700px" />
  </el-card>
</template>
<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { MyProcessViewer } from '@/components/bpmnProcessDesigner/package'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'

defineOptions({ name: 'BpmProcessInstanceBpmnViewer' })

const props = defineProps({
  loading: propTypes.bool.def(false), // 是否加载中
  id: propTypes.string, // 流程实例的编号
  bpmnXml: propTypes.string // BPMN XML
})

const view = ref({
  bpmnXml: ''
}) // BPMN 流程图数据

/** 只有 loading 完成时，才去加载流程列表 */
watch(
  () => props.loading,
  async (value) => {
    if (value && props.id) {
      view.value = await ProcessInstanceApi.getProcessInstanceBpmnModelView(props.id)
    }
  }
)

/** 监听 bpmnXml */
watch(
  () => props.bpmnXml,
  (value) => {
    view.value.bpmnXml = value
  }
)
</script>
<style>
.box-card {
  width: 100%;
  margin-bottom: 20px;
}
</style>
