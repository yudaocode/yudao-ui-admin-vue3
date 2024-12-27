<template>
  <!-- BPMN设计器 -->
  <template v-if="modelData.type === BpmModelType.BPMN">
    <BpmModelEditor
      v-if="showDesigner"
      :model-id="modelData.id"
      :model-key="modelData.key"
      :model-name="modelData.name"
      :value="modelData.bpmnXml"
      ref="bpmnEditorRef"
      @success="handleDesignSuccess"
    />
  </template>

  <!-- Simple设计器 -->
  <template v-else>
    <SimpleModelDesign
      v-if="showDesigner"
      :model-id="modelData.id"
      :model-key="modelData.key"
      :model-name="modelData.name"
      :value="modelData.bpmnXml"
      ref="simpleEditorRef"
      @success="handleDesignSuccess"
    />
  </template>
</template>

<script lang="ts" setup>
import { BpmModelType } from '@/utils/constants'
import BpmModelEditor from '../editor/index.vue'
import SimpleModelDesign from '../../simple/SimpleModelDesign.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const bpmnEditorRef = ref()
const simpleEditorRef = ref()

// 创建本地数据副本
const modelData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 表单校验 */
const validate = async () => {
  try {
    // 根据流程类型获取对应的编辑器引用
    const editorRef =
      modelData.value.type === BpmModelType.BPMN ? bpmnEditorRef.value : simpleEditorRef.value
    if (!editorRef) {
      throw new Error('流程设计器未初始化')
    }

    // 获取最新的XML数据
    const bpmnXml = await getXmlString()
    console.warn(bpmnXml, 'bpmnXml')
    if (!bpmnXml) {
      throw new Error('请设计流程')
    }

    return true
  } catch (error) {
    throw error
  }
}

/** 获取当前XML字符串 */
const getXmlString = async () => {
  try {
    if (modelData.value.type === BpmModelType.BPMN) {
      // BPMN设计器
      if (bpmnEditorRef.value) {
        const { xml } = await bpmnEditorRef.value.saveXML()
        if (xml) {
          // 更新本地数据
          modelData.value = {
            ...modelData.value,
            bpmnXml: xml
          }
        }
        return xml
      }
    } else {
      // Simple设计器
      if (simpleEditorRef.value) {
        const flowData = await simpleEditorRef.value.getCurrentFlowData()
        if (flowData) {
          const jsonData = JSON.stringify(flowData)
          // 更新本地数据
          modelData.value = {
            ...modelData.value,
            bpmnXml: jsonData
          }
          return jsonData
        }
      }
    }
    return undefined
  } catch (error) {
    console.error('获取流程数据失败:', error)
    return undefined
  }
}

/** 处理设计器保存成功 */
const handleDesignSuccess = (bpmnXml?: string) => {
  if (bpmnXml) {
    modelData.value = {
      ...modelData.value,
      bpmnXml
    }
    emit('success', bpmnXml)
  }
}

/** 是否显示设计器 */
const showDesigner = computed(() => {
  return Boolean(modelData.value?.key && modelData.value?.name)
})

defineExpose({
  validate,
  getXmlString
})
</script>
