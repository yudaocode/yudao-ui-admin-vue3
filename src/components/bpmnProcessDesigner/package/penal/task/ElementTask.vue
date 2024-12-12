<template>
  <div class="panel-tab__content">
    <el-form size="small" label-width="90px">
      <!-- add by 芋艿：由于「异步延续」暂时用不到，所以这里 display 为 none -->
      <el-form-item label="异步延续" style="display: none">
        <el-checkbox
          v-model="taskConfigForm.asyncBefore"
          label="异步前"
          value="异步前"
          @change="changeTaskAsync"
        />
        <el-checkbox
          v-model="taskConfigForm.asyncAfter"
          label="异步后"
          value="异步后"
          @change="changeTaskAsync"
        />
        <el-checkbox
          v-model="taskConfigForm.exclusive"
          v-if="taskConfigForm.asyncAfter || taskConfigForm.asyncBefore"
          label="排除"
          value="排除"
          @change="changeTaskAsync"
        />
      </el-form-item>
      <component :is="witchTaskComponent" v-bind="$props" />
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { installedComponent } from './data'

defineOptions({ name: 'ElementTaskConfig' })

const props = defineProps({
  id: String,
  type: String
})
const taskConfigForm = ref({
  asyncAfter: false,
  asyncBefore: false,
  exclusive: false
})
const witchTaskComponent = ref()

const bpmnElement = ref()

const bpmnInstances = () => (window as any).bpmnInstances
const changeTaskAsync = () => {
  if (!taskConfigForm.value.asyncBefore && !taskConfigForm.value.asyncAfter) {
    taskConfigForm.value.exclusive = false
  }
  bpmnInstances().modeling.updateProperties(bpmnInstances().bpmnElement, {
    ...taskConfigForm.value
  })
}

watch(
  () => props.id,
  () => {
    bpmnElement.value = bpmnInstances().bpmnElement
    taskConfigForm.value.asyncBefore = bpmnElement.value?.businessObject?.asyncBefore
    taskConfigForm.value.asyncAfter = bpmnElement.value?.businessObject?.asyncAfter
    taskConfigForm.value.exclusive = bpmnElement.value?.businessObject?.exclusive
  },
  { immediate: true }
)
watch(
  () => props.type,
  () => {
    if (props.type) {
      witchTaskComponent.value = installedComponent[props.type].component
    }
  },
  { immediate: true }
)
</script>
