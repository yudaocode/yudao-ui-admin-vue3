<template>
  <el-form-item label="请求地址" prop="config.url">
    <el-input v-model="config.url" placeholder="请输入请求地址" />
  </el-form-item>
  <el-form-item label="请求方法" prop="config.method">
    <el-select v-model="config.method" placeholder="请选择请求方法">
      <el-option label="GET" value="GET" />
      <el-option label="POST" value="POST" />
      <el-option label="PUT" value="PUT" />
      <el-option label="DELETE" value="DELETE" />
    </el-select>
  </el-form-item>
  <el-form-item label="请求头" prop="config.headers">
    <el-input
      v-model="headersStr"
      placeholder="请输入请求头，格式为 JSON"
      type="textarea"
      @input="handleHeadersChange"
    />
  </el-form-item>
  <el-form-item label="请求参数" prop="config.query">
    <el-input
      v-model="queryStr"
      placeholder="请输入请求参数，格式为 JSON"
      type="textarea"
      @input="handleQueryChange"
    />
  </el-form-item>
  <el-form-item label="请求体" prop="config.body">
    <el-input v-model="config.body" placeholder="请输入请求体" type="textarea" />
  </el-form-item>
</template>
<script lang="ts" setup>
import { HttpConfig, IoTDataBridgeConfigType } from '@/api/iot/rule/databridge'
import { useVModel } from '@vueuse/core'

defineOptions({ name: 'HttpConfigForm' })

const props = defineProps<{
  modelValue: any
}>()
const emit = defineEmits(['update:modelValue'])
const config = useVModel(props, 'modelValue', emit) as Ref<HttpConfig>

const headersStr = ref('{}')
const queryStr = ref('{}')

/** 组件初始化 */
onMounted(() => {
  config.value = {
    type: IoTDataBridgeConfigType.HTTP,
    url: '',
    method: 'GET',
    headers: {},
    query: {},
    body: ''
  }

  // 初始化字符串形式
  headersStr.value = JSON.stringify(config.value.headers || {}, null, 2)
  queryStr.value = JSON.stringify(config.value.query || {}, null, 2)
})

// 处理headers输入变化
const handleHeadersChange = (val: string) => {
  try {
    config.value.headers = JSON.parse(val)
  } catch (e) {
    // 解析失败，保留原始字符串
  }
}

// 处理query输入变化
const handleQueryChange = (val: string) => {
  try {
    config.value.query = JSON.parse(val)
  } catch (e) {
    // 解析失败，保留原始字符串
  }
}
</script>
