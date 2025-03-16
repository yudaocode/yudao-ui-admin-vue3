<template>
  <el-form-item label="NameServer" prop="config.nameServer">
    <el-input
      v-model="config.nameServer"
      placeholder="请输入 NameServer 地址，如：127.0.0.1:9876"
    />
  </el-form-item>
  <el-form-item label="AccessKey" prop="config.accessKey">
    <el-input v-model="config.accessKey" placeholder="请输入 AccessKey" />
  </el-form-item>
  <el-form-item label="SecretKey" prop="config.secretKey">
    <el-input
      v-model="config.secretKey"
      placeholder="请输入 SecretKey"
      show-password
      type="password"
    />
  </el-form-item>
  <el-form-item label="消费组" prop="config.group">
    <el-input v-model="config.group" placeholder="请输入消费组" />
  </el-form-item>
  <el-form-item label="主题" prop="config.topic">
    <el-input v-model="config.topic" placeholder="请输入主题" />
  </el-form-item>
  <el-form-item label="标签" prop="config.tags">
    <el-input v-model="config.tags" placeholder="请输入标签" />
  </el-form-item>
</template>
<script lang="ts" setup>
import { IoTDataBridgeConfigType, RocketMQConfig } from '@/api/iot/rule/databridge'
import { useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'RocketMQConfigForm' })

const props = defineProps<{
  modelValue: any
}>()
const emit = defineEmits(['update:modelValue'])
const config = useVModel(props, 'modelValue', emit) as Ref<RocketMQConfig>

/** 组件初始化 */
onMounted(() => {
  if (!isEmpty(config.value)) {
    return
  }
  config.value = {
    type: IoTDataBridgeConfigType.ROCKETMQ,
    nameServer: '',
    accessKey: '',
    secretKey: '',
    group: '',
    topic: '',
    tags: ''
  }
})
</script>
