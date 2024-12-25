<template>
  <el-form-item
    :rules="[{ required: true, message: '请选择调用方式', trigger: 'change' }]"
    label="调用方式"
    prop="service.callType"
  >
    <el-radio-group v-model="service.callType">
      <el-radio :value="ThingModelServiceCallType.ASYNC.value">
        {{ ThingModelServiceCallType.ASYNC.label }}
      </el-radio>
      <el-radio :value="ThingModelServiceCallType.SYNC.value">
        {{ ThingModelServiceCallType.SYNC.label }}
      </el-radio>
    </el-radio-group>
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { ThingModelService, ThingModelServiceCallType } from '@/api/iot/thingmodel'

/** IoT 物模型服务 */
defineOptions({ name: 'ThingModelService' })

const props = defineProps<{ modelValue: any; isStructDataSpecs?: boolean }>()
const emits = defineEmits(['update:modelValue'])
const service = useVModel(props, 'modelValue', emits) as Ref<ThingModelService>
</script>

<style lang="scss" scoped>
:deep(.el-form-item) {
  .el-form-item {
    margin-bottom: 0;
  }
}
</style>
