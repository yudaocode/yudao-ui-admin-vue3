<template>
  <div class="panel-tab__content">
    <component :is="customConfigComponent" v-bind="$props" />
  </div>
</template>

<script lang="ts" setup>
import { CustomConfigMap } from './data'

defineOptions({ name: 'ElementCustomConfig' })

const props = defineProps({
  id: String,
  type: String
})

const bpmnInstances = () => (window as any)?.bpmnInstances
const customConfigComponent = ref<any>(null)

watch(
  () => props.type,
  () => {
    if (props.type) {
      const element = bpmnInstances().bpmnElement.businessObject
      let elementType = props.type
      if (element.eventDefinitions) {
        // 处理类似共用BoundaryEvent类型的TimerEvent
        elementType += element.eventDefinitions[0].$type.split(':')[1]
      }
      const config = CustomConfigMap[elementType]
      if (config) {
        customConfigComponent.value = config.componet
        return
      }
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped></style>
