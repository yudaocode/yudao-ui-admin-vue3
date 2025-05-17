<template>
  <div>
    <el-form-item :label="$t('bpm.design.executeType')" key="executeType">
      <el-select v-model="serviceTaskForm.executeType">
        <el-option :label="$t('bpm.design.javaClass')" value="class" />
        <el-option :label="$t('bpm.design.expression')" value="expression" />
        <el-option :label="$t('bpm.design.delegateExpression')" value="delegateExpression" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="serviceTaskForm.executeType === 'class'"
      :label="$t('bpm.design.javaClass')"
      prop="class"
      key="execute-class"
    >
      <el-input v-model="serviceTaskForm.class" clearable @change="updateElementTask" />
    </el-form-item>
    <el-form-item
      v-if="serviceTaskForm.executeType === 'expression'"
      :label="$t('bpm.design.expression')"
      prop="expression"
      key="execute-expression"
    >
      <el-input v-model="serviceTaskForm.expression" clearable @change="updateElementTask" />
    </el-form-item>
    <el-form-item
      v-if="serviceTaskForm.executeType === 'delegateExpression'"
      :label="$t('bpm.design.delegateExpression')"
      prop="delegateExpression"
      key="execute-delegate"
    >
      <el-input v-model="serviceTaskForm.delegateExpression" clearable @change="updateElementTask" />
    </el-form-item>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'ServiceTask' })
const props = defineProps({
  id: String,
  type: String
})

const defaultTaskForm = ref({
  executeType: '',
  class: '',
  expression: '',
  delegateExpression: ''
})

const serviceTaskForm = ref<any>({})
const bpmnElement = ref()

const bpmnInstances = () => (window as any)?.bpmnInstances

const resetTaskForm = () => {
  for (let key in defaultTaskForm.value) {
    let value = bpmnElement.value?.businessObject[key] || defaultTaskForm.value[key]
    serviceTaskForm.value[key] = value
    if (value) {
      serviceTaskForm.value.executeType = key
    }
  }
}

const updateElementTask = () => {
  let taskAttr = Object.create(null);
  const type = serviceTaskForm.value.executeType;
  for (let key in serviceTaskForm.value) {
    if (key !== 'executeType' && key !== type) taskAttr[key] = null;
  }
  taskAttr[type] = serviceTaskForm.value[type] || "";
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), taskAttr)
}

onBeforeUnmount(() => {
  bpmnElement.value = null
})

watch(
  () => props.id,
  () => {
    bpmnElement.value = bpmnInstances().bpmnElement
    nextTick(() => {
      resetTaskForm()
    })
  },
  { immediate: true }
)

</script>
