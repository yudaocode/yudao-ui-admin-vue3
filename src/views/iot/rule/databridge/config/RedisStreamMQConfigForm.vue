<!-- TODO @puhui999：去掉 MQ 关键字哈 -->
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
  <el-form-item label="密码" prop="config.password">
    <el-input v-model="config.password" placeholder="请输入密码" show-password type="password" />
  </el-form-item>
  <el-form-item label="数据库" prop="config.database">
    <el-input-number
      v-model="config.database"
      :max="15"
      :min="0"
      controls-position="right"
      placeholder="请输入数据库索引"
    />
  </el-form-item>
  <el-form-item label="主题" prop="config.topic">
    <el-input v-model="config.topic" placeholder="请输入主题" />
  </el-form-item>
</template>
<script lang="ts" setup>
import { IoTDataBridgeConfigType, RedisStreamMQConfig } from '@/api/iot/rule/databridge'
import { useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'RedisStreamMQConfigForm' })

const props = defineProps<{
  modelValue: any
}>()
const emit = defineEmits(['update:modelValue'])
const config = useVModel(props, 'modelValue', emit) as Ref<RedisStreamMQConfig>

/** 组件初始化 */
onMounted(() => {
  if (!isEmpty(config.value)) {
    return
  }
  config.value = {
    type: IoTDataBridgeConfigType.REDIS_STREAM,
    host: '',
    port: 6379,
    password: '',
    database: 0,
    topic: ''
  }
})
</script>
