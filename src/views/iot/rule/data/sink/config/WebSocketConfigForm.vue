<template>
  <el-form-item label="服务器地址" prop="config.serverUrl">
    <el-input
      v-model="config.serverUrl"
      placeholder="请输入 WebSocket 地址，如：ws://localhost:8080/ws"
    />
  </el-form-item>
  <el-form-item label="连接超时(ms)" prop="config.connectTimeoutMs">
    <el-input-number
      v-model="config.connectTimeoutMs"
      :min="1000"
      :step="1000"
      controls-position="right"
    />
  </el-form-item>
  <el-form-item label="发送超时(ms)" prop="config.sendTimeoutMs">
    <el-input-number
      v-model="config.sendTimeoutMs"
      :min="1000"
      :step="1000"
      controls-position="right"
    />
  </el-form-item>
  <el-form-item label="心跳间隔(ms)" prop="config.heartbeatIntervalMs">
    <el-input-number
      v-model="config.heartbeatIntervalMs"
      :min="0"
      :step="1000"
      controls-position="right"
      placeholder="0 表示不启用心跳"
    />
  </el-form-item>
  <el-form-item label="心跳消息" prop="config.heartbeatMessage">
    <el-input v-model="config.heartbeatMessage" placeholder="请输入心跳消息内容（JSON 格式）" />
  </el-form-item>
  <el-form-item label="子协议" prop="config.subprotocols">
    <el-input v-model="config.subprotocols" placeholder="请输入子协议列表，多个用逗号分隔" />
  </el-form-item>
  <el-form-item label="自定义请求头" prop="config.customHeaders">
    <el-input
      v-model="config.customHeaders"
      type="textarea"
      placeholder="请输入自定义请求头（JSON 格式）"
    />
  </el-form-item>
  <el-form-item label="验证 SSL 证书" prop="config.verifySslCert">
    <el-switch v-model="config.verifySslCert" />
  </el-form-item>
  <el-form-item label="数据格式" prop="config.dataFormat">
    <el-select v-model="config.dataFormat" placeholder="请选择数据格式">
      <el-option label="JSON" value="JSON" />
      <el-option label="TEXT" value="TEXT" />
    </el-select>
  </el-form-item>
  <el-form-item label="重连间隔(ms)" prop="config.reconnectIntervalMs">
    <el-input-number
      v-model="config.reconnectIntervalMs"
      :min="1000"
      :step="1000"
      controls-position="right"
    />
  </el-form-item>
  <el-form-item label="最大重连次数" prop="config.maxReconnectAttempts">
    <el-input-number v-model="config.maxReconnectAttempts" :min="0" controls-position="right" />
  </el-form-item>
  <el-form-item label="启用压缩" prop="config.enableCompression">
    <el-switch v-model="config.enableCompression" />
  </el-form-item>
  <el-form-item label="发送重试次数" prop="config.sendRetryCount">
    <el-input-number v-model="config.sendRetryCount" :min="0" controls-position="right" />
  </el-form-item>
  <el-form-item label="重试间隔(ms)" prop="config.sendRetryIntervalMs">
    <el-input-number
      v-model="config.sendRetryIntervalMs"
      :min="100"
      :step="500"
      controls-position="right"
    />
  </el-form-item>
</template>
<script lang="ts" setup>
import { IotDataSinkTypeEnum, WebSocketConfig } from '@/api/iot/rule/data/sink'
import { useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'WebSocketConfigForm' })

const props = defineProps<{
  modelValue: any
}>()
const emit = defineEmits(['update:modelValue'])
const config = useVModel(props, 'modelValue', emit) as Ref<WebSocketConfig>

/** 组件初始化 */
onMounted(() => {
  if (!isEmpty(config.value)) {
    return
  }
  config.value = {
    type: IotDataSinkTypeEnum.WEBSOCKET + '',
    serverUrl: '',
    connectTimeoutMs: 5000,
    sendTimeoutMs: 10000,
    heartbeatIntervalMs: 30000,
    heartbeatMessage: '{"type":"heartbeat"}',
    subprotocols: '',
    customHeaders: '',
    verifySslCert: true,
    dataFormat: 'JSON',
    reconnectIntervalMs: 5000,
    maxReconnectAttempts: 3,
    enableCompression: false,
    sendRetryCount: 1,
    sendRetryIntervalMs: 1000
  }
})
</script>
