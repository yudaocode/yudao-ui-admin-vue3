<template>
  <!-- BPMN设计器 -->
  <template v-if="modelData.type === BpmModelType.BPMN">
    <BpmModelEditor
      v-if="showDesigner"
      :model-id="modelData.id"
      :model-key="modelData.key"
      :model-name="modelData.name"
      :value="currentBpmnXml"
      ref="bpmnEditorRef"
      @success="handleDesignSuccess"
      @init-finished="handleEditorInit"
    />
  </template>

  <!-- Simple设计器 -->
  <template v-else>
    <SimpleModelDesign
      v-if="showDesigner"
      :model-id="modelData.id"
      :model-key="modelData.key"
      :model-name="modelData.name"
      :start-user-ids="modelData.startUserIds"
      :value="currentSimpleModel"
      ref="simpleEditorRef"
      @success="handleDesignSuccess"
      @init-finished="handleEditorInit"
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
const isEditorInitialized = ref(false)

// 创建本地数据副本
const modelData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 保存当前的流程XML或数据
const currentBpmnXml = ref('')
const currentSimpleModel = ref('')

// 初始化或更新当前的XML数据
const initOrUpdateXmlData = () => {
  if (modelData.value) {
    if (modelData.value.type === BpmModelType.BPMN) {
      currentBpmnXml.value = modelData.value.bpmnXml || ''
    } else {
      currentSimpleModel.value = modelData.value.simpleModel || ''
    }
  }
}

// 监听modelValue的变化，更新数据
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      if (newVal.type === BpmModelType.BPMN) {
        if (newVal.bpmnXml && newVal.bpmnXml !== currentBpmnXml.value) {
          currentBpmnXml.value = newVal.bpmnXml
          // 如果编辑器已经初始化，刷新视图
          if (isEditorInitialized.value && bpmnEditorRef.value?.refresh) {
            nextTick(() => {
              bpmnEditorRef.value.refresh()
            })
          }
        }
      } else {
        if (newVal.simpleModel && newVal.simpleModel !== currentSimpleModel.value) {
          currentSimpleModel.value = newVal.simpleModel
          // 如果编辑器已经初始化，刷新视图
          if (isEditorInitialized.value && simpleEditorRef.value?.refresh) {
            nextTick(() => {
              simpleEditorRef.value.refresh()
            })
          }
        }
      }
    }
  },
  { immediate: true, deep: true }
)

/** 编辑器初始化完成的回调 */
const handleEditorInit = async () => {
  isEditorInitialized.value = true

  // 等待下一个tick，确保编辑器已经准备好
  await nextTick()

  // 初始化完成后，设置初始值
  if (modelData.value.type === BpmModelType.BPMN) {
    if (modelData.value.bpmnXml) {
      currentBpmnXml.value = modelData.value.bpmnXml
      if (bpmnEditorRef.value?.refresh) {
        await nextTick()
        bpmnEditorRef.value.refresh()
      }
    }
  } else {
    if (modelData.value.simpleModel) {
      currentSimpleModel.value = modelData.value.simpleModel
      if (simpleEditorRef.value?.refresh) {
        await nextTick()
        simpleEditorRef.value.refresh()
      }
    }
  }
}

/** 获取当前流程数据 */
const getProcessData = async () => {
  try {
    if (modelData.value.type === BpmModelType.BPMN) {
      if (!bpmnEditorRef.value || !isEditorInitialized.value) {
        return currentBpmnXml.value || undefined
      }
      const { xml } = await bpmnEditorRef.value.saveXML()
      if (xml) {
        currentBpmnXml.value = xml
        return xml
      }
    } else {
      if (!simpleEditorRef.value || !isEditorInitialized.value) {
        return currentSimpleModel.value || undefined
      }
      const flowData = await simpleEditorRef.value.getCurrentFlowData()
      if (flowData) {
        currentSimpleModel.value = flowData
        return flowData
      }
    }
    return modelData.value.type === BpmModelType.BPMN
      ? currentBpmnXml.value
      : currentSimpleModel.value
  } catch (error) {
    console.error('获取流程数据失败:', error)
    return modelData.value.type === BpmModelType.BPMN
      ? currentBpmnXml.value
      : currentSimpleModel.value
  }
}

/** 表单校验 */
const validate = async () => {
  try {
    // 获取最新的流程数据
    const processData = await getProcessData()
    if (!processData) {
      throw new Error('请设计流程')
    }
    return true
  } catch (error) {
    throw error
  }
}

/** 处理设计器保存成功 */
const handleDesignSuccess = async (data?: any) => {
  if (data) {
    if (modelData.value.type === BpmModelType.BPMN) {
      currentBpmnXml.value = data
    } else {
      currentSimpleModel.value = data
    }

    // 创建新的对象以触发响应式更新
    const newModelData = {
      ...modelData.value,
      bpmnXml: modelData.value.type === BpmModelType.BPMN ? data : null,
      simpleModel: modelData.value.type === BpmModelType.BPMN ? null : data
    }

    // 使用emit更新父组件的数据
    await nextTick()
    emit('update:modelValue', newModelData)
    emit('success', data)
  }
}

/** 是否显示设计器 */
const showDesigner = computed(() => {
  return Boolean(modelData.value?.key && modelData.value?.name)
})

// 组件创建时初始化数据
onMounted(() => {
  initOrUpdateXmlData()
})

// 组件卸载前保存数据
onBeforeUnmount(async () => {
  try {
    // 获取并保存最新的流程数据
    const data = await getProcessData()
    if (data) {
      // 创建新的对象以触发响应式更新
      const newModelData = {
        ...modelData.value,
        bpmnXml: modelData.value.type === BpmModelType.BPMN ? data : null,
        simpleModel: modelData.value.type === BpmModelType.BPMN ? null : data
      }

      // 使用emit更新父组件的数据
      await nextTick()
      emit('update:modelValue', newModelData)
    }
  } catch (error) {
    console.error('保存数据失败:', error)
  }
})

defineExpose({
  validate,
  getProcessData
})
</script>
