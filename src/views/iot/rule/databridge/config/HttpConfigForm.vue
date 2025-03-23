<template>
  <el-form-item label="请求地址" prop="config.url">
    <el-input v-model="urlPath" placeholder="请输入请求地址">
      <template #prepend>
        <el-select v-model="urlPrefix" placeholder="Select" style="width: 115px">
          <el-option label="http://" value="http://" />
          <el-option label="https://" value="https://" />
        </el-select>
      </template>
    </el-input>
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
    <key-value-editor v-model="config.headers" add-button-text="添加请求头" />
  </el-form-item>
  <el-form-item label="请求参数" prop="config.query">
    <key-value-editor v-model="config.query" add-button-text="添加参数" />
  </el-form-item>
  <el-form-item label="请求体" prop="config.body">
    <el-input v-model="config.body" placeholder="请输入内容" type="textarea" />
  </el-form-item>
</template>

<script lang="ts" setup>
import { HttpConfig, IoTDataBridgeConfigType } from '@/api/iot/rule/databridge'
import { useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'
import KeyValueEditor from './components/KeyValueEditor.vue'

defineOptions({ name: 'HttpConfigForm' })

const props = defineProps<{
  modelValue: any
}>()
const emit = defineEmits(['update:modelValue'])
const config = useVModel(props, 'modelValue', emit) as Ref<HttpConfig>

/** URL处理 */
const urlPrefix = ref('http://')
const urlPath = ref('')
const fullUrl = computed(() => {
  return urlPath.value ? urlPrefix.value + urlPath.value : ''
})

/** 监听 URL 变化 */
watch([urlPrefix, urlPath], () => {
  config.value.url = fullUrl.value
})

/** 组件初始化 */
onMounted(() => {
  if (!isEmpty(config.value)) {
    // 初始化 URL
    if (config.value.url) {
      if (config.value.url.startsWith('https://')) {
        urlPrefix.value = 'https://'
        urlPath.value = config.value.url.substring(8)
      } else if (config.value.url.startsWith('http://')) {
        urlPrefix.value = 'http://'
        urlPath.value = config.value.url.substring(7)
      } else {
        urlPath.value = config.value.url
      }
    }
    return
  }

  config.value = {
    type: IoTDataBridgeConfigType.HTTP,
    url: '',
    method: 'POST',
    headers: {},
    query: {},
    body: ''
  }
})
</script>
