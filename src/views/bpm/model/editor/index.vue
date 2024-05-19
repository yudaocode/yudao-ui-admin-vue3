<template>
  <ContentWrap>
    <!-- 流程设计器，负责绘制流程等 -->
    <MyProcessDesigner
      key="designer"
      v-if="xmlString !== undefined"
      v-model="xmlString"
      :value="xmlString"
      v-bind="controlForm"
      keyboard
      ref="processDesigner"
      @init-finished="initModeler"
      :additionalModel="controlForm.additionalModel"
      @save="save"
    />
    <!-- 流程属性器，负责编辑每个流程节点的属性 -->
    <MyProcessPenal
      key="penal"
      :bpmnModeler="modeler as any"
      :prefix="controlForm.prefix"
      class="process-panel"
      :model="model"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { MyProcessDesigner, MyProcessPenal } from '@/components/bpmnProcessDesigner/package'
// 自定义元素选中时的弹出菜单（修改 默认任务 为 用户任务）
import CustomContentPadProvider from '@/components/bpmnProcessDesigner/package/designer/plugins/content-pad'
// 自定义左侧菜单（修改 默认任务 为 用户任务）
import CustomPaletteProvider from '@/components/bpmnProcessDesigner/package/designer/plugins/palette'
import * as ModelApi from '@/api/bpm/model'

defineOptions({ name: 'BpmModelEditor' })

const router = useRouter() // 路由
const { query } = useRoute() // 路由的查询
const message = useMessage() // 国际化

const xmlString = ref(undefined) // BPMN XML
const modeler = ref(null) // BPMN Modeler
const controlForm = ref({
  simulation: true,
  labelEditing: false,
  labelVisible: false,
  prefix: 'flowable',
  headerButtonSize: 'mini',
  additionalModel: [CustomContentPadProvider, CustomPaletteProvider]
})
const model = ref<ModelApi.ModelVO>() // 流程模型的信息

/** 初始化 modeler */
const initModeler = (item) => {
  setTimeout(() => {
    modeler.value = item
  }, 10)
}

/** 添加/修改模型 */
const save = async (bpmnXml) => {
  const data = {
    ...model.value,
    bpmnXml: bpmnXml // bpmnXml 只是初始化流程图，后续修改无法通过它获得
  } as unknown as ModelApi.ModelVO
  // 提交
  if (data.id) {
    await ModelApi.updateModel(data)
    message.success('修改成功')
  } else {
    await ModelApi.createModel(data)
    message.success('新增成功')
  }
  // 跳转回去
  close()
}

/** 关闭按钮 */
const close = () => {
  router.push({ path: '/bpm/manager/model' })
}

/** 初始化 */
onMounted(async () => {
  const modelId = query.modelId as unknown as number
  if (!modelId) {
    message.error('缺少模型 modelId 编号')
    return
  }
  // 查询模型
  const data = await ModelApi.getModel(modelId)
  if (!data.bpmnXml) {
    // 首次创建的 Model 模型，它是没有 bpmnXml，此时需要给它一个默认的
    data.bpmnXml = ` <?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.activiti.org/processdef">
  <process id="${data.key}" name="${data.name}" isExecutable="true" />
  <bpmndi:BPMNDiagram id="BPMNDiagram">
    <bpmndi:BPMNPlane id="${data.key}_di" bpmnElement="${data.key}" />
  </bpmndi:BPMNDiagram>
</definitions>`
  }
  model.value = {
    ...data,
    bpmnXml: undefined // 清空 bpmnXml 属性
  }
  xmlString.value = data.bpmnXml
})
</script>
<style lang="scss">
.process-panel__container {
  position: absolute;
  top: 90px;
  right: 60px;
}
</style>
