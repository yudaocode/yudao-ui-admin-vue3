<template>
  <el-form-item
    :rules="[{ required: true, message: '请选择事件类型', trigger: 'change' }]"
    label="事件类型"
    prop="thingModelEvent.type"
  >
    <el-radio-group v-model="thingModelEvent.type">
      <el-radio :value="ThingModelServiceEventType.INFO.value">
        {{ ThingModelServiceEventType.INFO.label }}
      </el-radio>
      <el-radio :value="ThingModelServiceEventType.ALERT.value">
        {{ ThingModelServiceEventType.ALERT.label }}
      </el-radio>
      <el-radio :value="ThingModelServiceEventType.ERROR.value">
        {{ ThingModelServiceEventType.ERROR.label }}
      </el-radio>
    </el-radio-group>
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { ThingModelEvent, ThingModelServiceEventType } from '@/api/iot/thingmodel'

/** IoT 物模型事件 */
defineOptions({ name: 'ThingModelEvent' })

const props = defineProps<{ modelValue: any; isStructDataSpecs?: boolean }>()
const emits = defineEmits(['update:modelValue'])
const thingModelEvent = useVModel(props, 'modelValue', emits) as Ref<ThingModelEvent>
</script>

<style lang="scss" scoped>
:deep(.el-form-item) {
  .el-form-item {
    margin-bottom: 0;
  }
}
</style>
