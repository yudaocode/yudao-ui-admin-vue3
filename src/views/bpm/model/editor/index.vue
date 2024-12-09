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
      :model="model"
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

const props = defineProps<{
  modelId?: string
  modelKey?: string
  modelName?: string
}>()

const emit = defineEmits(['success'])
const message = useMessage() // 国际化

const xmlString = ref<string>() // BPMN XML
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

/** 获取默认的BPMN XML */
const getDefaultBpmnXml = (key: string, name: string) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.activiti.org/processdef">
  <process id="${key}" name="${name}" isExecutable="true" />
  <bpmndi:BPMNDiagram id="BPMNDiagram">
    <bpmndi:BPMNPlane id="${key}_di" bpmnElement="${key}" />
  </bpmndi:BPMNDiagram>
</definitions>`
}

/** 添加/修改模型 */
const save = async (bpmnXml: string) => {
  try {
    if (props.modelId) {
      // 编辑模式
      const data = {
        ...model.value,
        bpmnXml: bpmnXml
      } as unknown as ModelApi.ModelVO
      await ModelApi.updateModelBpmn(data)
      emit('success')
    } else {
      // 新建模式，直接返回XML
      emit('success', bpmnXml)
    }
  } catch (error) {
    console.error('保存失败:', error)
    message.error('保存失败')
  }
}

/** 初始化 */
onMounted(async () => {
  if (props.modelId) {
    // 编辑模式
    try {
      // 查询模型
      const data = await ModelApi.getModel(props.modelId)
      model.value = {
        ...data,
        bpmnXml: undefined // 清空 bpmnXml 属性
      }
      xmlString.value = data.bpmnXml || getDefaultBpmnXml(data.key, data.name)
    } catch (error) {
      console.error('获取模型失败:', error)
      message.error('获取模型失败')
    }
  } else if (props.modelKey && props.modelName) {
    // 新建模式，使用传入的key和name创建默认XML
    xmlString.value = getDefaultBpmnXml(props.modelKey, props.modelName)
    model.value = {
      key: props.modelKey,
      name: props.modelName
    } as ModelApi.ModelVO
  }
})

// 监听key和name的变化
watch([() => props.modelKey, () => props.modelName], ([newKey, newName]) => {
  if (!props.modelId && newKey && newName) {
    xmlString.value = getDefaultBpmnXml(newKey, newName)
    model.value = {
      key: newKey,
      name: newName
    } as ModelApi.ModelVO
  }
}, { immediate: true })
</script>
<style lang="scss">
.process-panel__container {
  position: absolute;
  top: 90px;
  right: 60px;
}
</style>
