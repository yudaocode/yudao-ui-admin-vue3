<template>
  <!-- BPMN设计器 -->
  <template v-if="modelData.type === BpmModelType.BPMN">
    <BpmModelEditor
      v-if="showDesigner"
      :model-id="modelData.id"
      :model-key="modelData.key"
      :model-name="modelData.name"
      @success="handleDesignSuccess"
    />
  </template>

  <!-- Simple设计器 -->
  <template v-else>
    <SimpleModelDesign
      v-if="showDesigner"
      :model-name="modelData.name"
      :model-form-id="modelData.formId"
      :model-form-type="modelData.formType"
      :start-user-ids="modelData.startUserIds"
      :start-dept-ids="modelData.startDeptIds"
      @success="handleDesignSuccess"
    />
  </template>
</template>

<script lang="ts" setup>
import { BpmModelType } from '@/utils/constants'
import BpmModelEditor from './editor/index.vue'
import SimpleModelDesign from '../../simple/SimpleModelDesign.vue'

// 创建本地数据副本
const modelData = defineModel<any>()

const processData = inject('processData') as Ref

/** 表单校验 */
const validate = async () => {
  try {
    // 获取最新的流程数据
    if (!processData.value) {
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
    // 创建新的对象以触发响应式更新
    const newModelData = {
      ...modelData.value,
      bpmnXml: modelData.value.type === BpmModelType.BPMN ? data : null,
      simpleModel: modelData.value.type === BpmModelType.BPMN ? null : data
    }
    // 使用emit更新父组件的数据
    await nextTick()
    //更新表单的模型数据部分
    modelData.value = newModelData
  }
}

/** 是否显示设计器 */
const showDesigner = computed(() => {
  return Boolean(modelData.value?.key && modelData.value?.name)
})
defineExpose({
  validate
})
</script>
