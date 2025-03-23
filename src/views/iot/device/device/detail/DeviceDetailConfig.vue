<!-- 设备配置 -->
<template>
  <div>
    <el-alert
      title="支持远程更新设备的配置文件(JSON 格式)，可以在下方编辑配置模板，对设备的系统参数、网络参数等进行远程配置。配置完成后，需点击「下发」按钮，设备即可进行远程配置。"
      type="info"
      show-icon
      class="my-4"
      description="如需编辑文件，请点击下方编辑按钮"
    />

    <!-- JSON 编辑器：读模式 -->
    <Vue3Jsoneditor
      v-if="isEditing"
      v-model="config"
      :options="editorOptions"
      height="500px"
      currentMode="code"
      @error="onError"
    />
    <!-- JSON 编辑器：写模式 -->
    <Vue3Jsoneditor
      v-else
      v-model="config"
      :options="editorOptions"
      height="500px"
      currentMode="view"
      v-loading.fullscreen.lock="loading"
      @error="onError"
    />
    <div class="mt-5 text-center">
      <el-button v-if="isEditing" @click="cancelEdit">取消</el-button>
      <el-button v-if="isEditing" type="primary" @click="saveConfig" :disabled="hasJsonError">
        保存
      </el-button>
      <el-button v-else @click="enableEdit">编辑</el-button>
      <!-- TODO @芋艿：缺一个下发按钮 -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import Vue3Jsoneditor from 'v3-jsoneditor/src/Vue3Jsoneditor.vue'
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { jsonParse } from '@/utils'

const props = defineProps<{
  device: DeviceVO
}>()

const emit = defineEmits<{
  (e: 'success'): void // 定义 success 事件，不需要参数
}>()

const message = useMessage()
const loading = ref(false) // 加载中
const config = ref<any>({}) // 只存储 config 字段
const hasJsonError = ref(false) // 是否有 JSON 格式错误

/** 监听 props.device 的变化，只更新 config 字段 */
watchEffect(() => {
  config.value = jsonParse(props.device.config)
})

const isEditing = ref(false) // 编辑状态
const editorOptions = computed(() => ({
  mainMenuBar: false,
  navigationBar: false,
  statusBar: false
})) // JSON 编辑器的选项

/** 启用编辑模式的函数 */
const enableEdit = () => {
  isEditing.value = true
  hasJsonError.value = false // 重置错误状态
}

/** 取消编辑的函数 */
const cancelEdit = () => {
  config.value = jsonParse(props.device.config)
  isEditing.value = false
  hasJsonError.value = false // 重置错误状态
}

/** 保存配置的函数 */
const saveConfig = async () => {
  if (hasJsonError.value) {
    message.error('JSON格式错误，请修正后再提交！')
    return
  }
  await updateDeviceConfig()
  isEditing.value = false
}

/** 更新设备配置 */
const updateDeviceConfig = async () => {
  try {
    // 提交请求
    loading.value = true
    await DeviceApi.updateDevice({
      id: props.device.id,
      config: JSON.stringify(config.value)
    } as DeviceVO)
    message.success('更新成功！')
    // 触发 success 事件
    emit('success')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

/** 处理 JSON 编辑器错误的函数 */
const onError = (e: any) => {
  console.log('onError', e)
  hasJsonError.value = true
}
</script>
