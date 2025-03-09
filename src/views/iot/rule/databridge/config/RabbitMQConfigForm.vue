<template>
  <el-form-item label="主机地址" prop="config.host">
    <el-input v-model="config.host" placeholder="请输入主机地址，如：localhost" />
  </el-form-item>
  <el-form-item label="端口" prop="config.port">
    <el-input-number
      v-model="config.port"
      :max="65535"
      :min="1"
      controls-position="right"
      placeholder="请输入端口"
    />
  </el-form-item>
  <el-form-item label="虚拟主机" prop="config.virtualHost">
    <el-input v-model="config.virtualHost" placeholder="请输入虚拟主机" />
  </el-form-item>
  <el-form-item label="用户名" prop="config.username">
    <el-input v-model="config.username" placeholder="请输入用户名" />
  </el-form-item>
  <el-form-item label="密码" prop="config.password">
    <el-input v-model="config.password" placeholder="请输入密码" show-password type="password" />
  </el-form-item>
  <el-form-item label="交换机" prop="config.exchange">
    <el-input v-model="config.exchange" placeholder="请输入交换机" />
  </el-form-item>
  <el-form-item label="路由键" prop="config.routingKey">
    <el-input v-model="config.routingKey" placeholder="请输入路由键" />
  </el-form-item>
  <el-form-item label="队列" prop="config.queue">
    <el-input v-model="config.queue" placeholder="请输入队列" />
  </el-form-item>
</template>
<script lang="ts" setup>
import { IoTDataBridgeConfigType, RabbitMQConfig } from '@/api/iot/rule/databridge'
import { useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'RabbitMQConfigForm' })

const props = defineProps<{
  modelValue: any
}>()
const emit = defineEmits(['update:modelValue'])
const config = useVModel(props, 'modelValue', emit) as Ref<RabbitMQConfig>

/** 组件初始化 */
onMounted(() => {
  if (!isEmpty(config.value)) {
    return
  }
  config.value = {
    type: IoTDataBridgeConfigType.RABBITMQ,
    host: '',
    port: 5672,
    virtualHost: '/',
    username: '',
    password: '',
    exchange: '',
    routingKey: '',
    queue: ''
  }
})
</script>
