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
    if (newVal?.bpmnXml) {
      xmlString.value = newVal.bpmnXml
    }
  },
  { immediate: true, deep: true }
)

/** 处理设计器保存成功 */
const handleDesignSuccess = (bpmnXml?: string) => {
  if (bpmnXml) {
    xmlString.value = bpmnXml
    modelData.value = {
      ...modelData.value,
      bpmnXml
    }
    emit('success', bpmnXml)
  }
}

/** 表单校验 */
const validate = async () => {
  // 获取最新的XML数据
  const currentXml = xmlString.value || modelData.value?.bpmnXml

  // 如果是修改场景且有XML数据（无论是新的还是原有的）
  if (modelData.value.id && currentXml) {
    return true
  }

  // 新增场景必须有XML数据
  if (!currentXml) {
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
  return xmlString.value || modelData.value?.bpmnXml || ''
}

defineExpose({
  validate,
  getXmlString
})
</script>
