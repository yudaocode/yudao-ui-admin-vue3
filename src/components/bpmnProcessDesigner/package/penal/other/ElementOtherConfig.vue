<template>
  <div class="panel-tab__content">
    <div class="element-property input-property">
      <div class="element-property__label">元素文档：</div>
      <div class="element-property__value">
        <el-input
          type="textarea"
          v-model="documentation"
          resize="vertical"
          :autosize="{ minRows: 2, maxRows: 4 }"
          @input="updateDocumentation"
          @blur="updateDocumentation"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'ElementOtherConfig' })
const props = defineProps({
  id: String
})
const documentation = ref('')
const bpmnElement = ref()
const bpmnInstances = () => (window as any).bpmnInstances
const updateDocumentation = () => {
  ;(bpmnElement.value && bpmnElement.value.id === props.id) ||
    (bpmnElement.value = bpmnInstances().elementRegistry.get(props.id))
  const documentations = bpmnInstances().bpmnFactory.create('bpmn:Documentation', {
    text: documentation.value
  })
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    documentation: [documentations]
  })
}
onBeforeUnmount(() => {
  bpmnElement.value = null
})

watch(
  () => props.id,
  (id) => {
    if (id && id.length) {
      nextTick(() => {
        const documentations = bpmnInstances().bpmnElement.businessObject?.documentation
        documentation.value = documentations && documentations.length ? documentations[0].text : ''
      })
    } else {
      documentation.value = ''
    }
  },
  { immediate: true }
)
</script>
