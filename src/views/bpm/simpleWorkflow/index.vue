<template>
  <SimpleProcessDesigner :model-id="modelId"/>
</template>
<script setup lang='ts'>
import { SimpleProcessDesigner } from '@/components/SimpleProcessDesignerV2/src/';
import { getModel } from '@/api/bpm/model'
import { getForm, FormVO } from '@/api/bpm/form'
defineOptions({
  name: 'SimpleWorkflowDesignEditor'
})
const { query } = useRoute() // 路由的查询
const modelId : string | undefined = query.modelId  as string;
const formFields = ref<string[]>([])
const formType = ref(20);
provide('formFields', formFields)
provide('formType', formType)
onMounted( async () => {
  const bpmnModel = await getModel(modelId);
  if (bpmnModel) {
    formType.value = bpmnModel.formType
    if (formType.value === 10) {
      const bpmnForm = await getForm(bpmnModel.formId) as unknown as FormVO
      formFields.value = bpmnForm?.fields
    }
  }
})
</script>
<style lang='scss' scoped>

</style>
