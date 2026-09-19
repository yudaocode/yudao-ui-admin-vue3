<template>
  <el-card v-loading="loading" class="box-card">
    <MyProcessViewer key="designer" :xml="view.bpmnXml || ''" :view="view" class="process-viewer" />
  </el-card>
</template>
<script lang="ts" setup>
import { onMounted } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { MyProcessViewer } from '@/components/bpmnProcessDesigner/package'

defineOptions({ name: 'BpmProcessInstanceBpmnViewer' })

const props = defineProps({
  loading: propTypes.bool.def(false), // 是否加载中
  bpmnXml: propTypes.string.def(''), // BPMN XML
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
      view.value = {
        ...newModelView,
        bpmnXml: newModelView.bpmnXml || ''
      }
    }
  }
)

/** 监听 bpmnXml */
watch(
  () => props.bpmnXml,
  (value) => {
    view.value.bpmnXml = value || ''
  }
)

/** 初始同步 props 到 view */
const syncView = () => {
  if (props.modelView) {
    //@ts-ignore
    view.value = props.modelView
  }
  if (props.bpmnXml) {
    view.value.bpmnXml = props.bpmnXml
  }
}

/** mounted：初始同步 */
onMounted(() => {
  syncView()
})
</script>
<style lang="scss" scoped>
.box-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;

  :deep(.el-card__body) {
    flex: 1;
    padding: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  :deep(.process-viewer) {
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
}
</style>
