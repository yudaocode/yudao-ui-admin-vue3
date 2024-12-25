<template>
  <!-- BPMN设计器 -->
  <template v-if="modelData.type === BpmModelType.BPMN">
    <BpmModelEditor
      v-if="showDesigner"
      :model-id="modelData.id"
      :model-key="modelData.key"
      :model-name="modelData.name"
      :value="modelData.bpmnXml"
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

const xmlString = ref<string>()

// 创建本地数据副本
const modelData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 监听modelValue变化,确保XML数据同步
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal.bpmnXml) {
      xmlString.value = newVal.bpmnXml
    }
  },
  { immediate: true, deep: true }
)

/** 处理设计器保存成功 */
const handleDesignSuccess = (bpmnXml?: string) => {
  if (bpmnXml) {
    xmlString.value = bpmnXml
    emit('update:modelValue', {
      ...modelData.value,
      bpmnXml
    })
    emit('success', bpmnXml)
  }
}

/** 表单校验 */
const validate = async () => {
  // 修改场景下，如果已有 modelData.bpmnXml 则不需要重新校验
  if (modelData.value.id && modelData.value.bpmnXml) {
    return true
  }
  // 新增场景或无 bpmnXml 时才校验
  if (!xmlString.value) {
    throw new Error('请设计流程')
  }
  return true
}

/** 是否显示设计器 */
const showDesigner = computed(() => {
  return Boolean(modelData.value?.key && modelData.value?.name)
})

/** 获取当前XML字符串 */
const getXmlString = () => {
  // 优先返回最新的 xmlString
  return xmlString.value || modelData.value?.bpmnXml
}

defineExpose({
  validate,
  getXmlString
})
</script>
