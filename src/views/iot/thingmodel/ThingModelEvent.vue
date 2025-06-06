<!-- 产品的物模型表单（event 项） -->
<template>
  <el-form-item
    :rules="[{ required: true, message: '请选择事件类型', trigger: 'change' }]"
    label="事件类型"
    prop="event.type"
  >
    <el-radio-group v-model="thingModelEvent.type">
      <el-radio :value="ThingModelEventType.INFO.value">
        {{ ThingModelEventType.INFO.label }}
      </el-radio>
      <el-radio :value="ThingModelEventType.ALERT.value">
        {{ ThingModelEventType.ALERT.label }}
      </el-radio>
      <el-radio :value="ThingModelEventType.ERROR.value">
        {{ ThingModelEventType.ERROR.label }}
      </el-radio>
    </el-radio-group>
  </el-form-item>
  <el-form-item label="输出参数">
    <ThingModelInputOutputParam
      v-model="thingModelEvent.outputParams"
      :direction="ThingModelParamDirection.OUTPUT"
    />
  </el-form-item>
</template>

<script lang="ts" setup>
import ThingModelInputOutputParam from './ThingModelInputOutputParam.vue'
import { useVModel } from '@vueuse/core'
import { ThingModelEvent } from '@/api/iot/thingmodel'
import { ThingModelEventType, ThingModelParamDirection } from './config'
import { isEmpty } from '@/utils/is'

/** IoT 物模型事件 */
defineOptions({ name: 'ThingModelEvent' })

const props = defineProps<{ modelValue: any; isStructDataSpecs?: boolean }>()
const emits = defineEmits(['update:modelValue'])
const thingModelEvent = useVModel(props, 'modelValue', emits) as Ref<ThingModelEvent>

// 默认选中，INFO 信息
watch(
  () => thingModelEvent.value.type,
  (val: string) => isEmpty(val) && (thingModelEvent.value.type = ThingModelEventType.INFO.value),
  { immediate: true }
)
</script>

<style lang="scss" scoped>
:deep(.el-form-item) {
  .el-form-item {
    margin-bottom: 0;
  }
}
</style>
