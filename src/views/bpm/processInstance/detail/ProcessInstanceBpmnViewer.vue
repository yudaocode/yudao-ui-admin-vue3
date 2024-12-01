<template>
  <el-card v-loading="loading" class="box-card">
    <MyProcessViewer key="designer" :xml="view.bpmnXml" :view="view" class="process-viewer" />
  </el-card>
</template>
<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { MyProcessViewer } from '@/components/bpmnProcessDesigner/package'

defineOptions({ name: 'BpmProcessInstanceBpmnViewer' })

const props = defineProps({
  loading: propTypes.bool.def(false), // 是否加载中
  bpmnXml: propTypes.string, // BPMN XML
  modelView: propTypes.object
})

const view = ref({
  bpmnXml: ''
}) // BPMN 流程图数据


/** 只有 loading 完成时，才去加载流程列表 */
watch(
  () => props.modelView,
  async (newModelView) => {
    // 加载最新
    if (newModelView) {
      //@ts-ignore
      view.value = newModelView
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
<style lang="scss" scoped>
.box-card {
  height: 100%;
  width: 100%;
  margin-bottom: 0;

  :deep(.el-card__body) {
    height: 100%;
    padding: 0;
  }

  :deep(.process-viewer) {
    height: 100% !important;
    min-height: 100%;
    width: 100%;
    overflow: auto;
  }
}
</style>
