<template>
  <el-form-item label="服务地址" prop="config.bootstrapServers">
    <el-input v-model="config.bootstrapServers" placeholder="请输入服务地址，如：localhost:9092" />
  </el-form-item>
  <el-form-item label="用户名" prop="config.username">
    <el-input v-model="config.username" placeholder="请输入用户名" />
  </el-form-item>
  <el-form-item label="密码" prop="config.password">
    <el-input v-model="config.password" placeholder="请输入密码" show-password type="password" />
  </el-form-item>
  <el-form-item label="启用 SSL" prop="config.ssl">
    <el-switch v-model="config.ssl" />
  </el-form-item>
  <el-form-item label="主题" prop="config.topic">
    <el-input v-model="config.topic" placeholder="请输入主题" />
  </el-form-item>
</template>
<script lang="ts" setup>
import { IoTDataBridgeConfigType, KafkaMQConfig } from '@/api/iot/rule/databridge'
import { useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'KafkaMQConfigForm' })

const props = defineProps<{
  modelValue: any
}>()
const emit = defineEmits(['update:modelValue'])
const config = useVModel(props, 'modelValue', emit) as Ref<KafkaMQConfig>

/** 组件初始化 */
onMounted(() => {
  if (!isEmpty(config.value)) {
    return
  }
  config.value = {
    type: IoTDataBridgeConfigType.KAFKA,
    bootstrapServers: '',
    username: '',
    password: '',
    ssl: false,
    topic: ''
  }
})
</script>
