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
    <JsonEditor
      v-model="config"
      :mode="isEditing ? 'code' : 'view'"
      height="600px"
      @error="onError"
    />
    <div class="mt-5 text-center">
      <el-button v-if="isEditing" @click="cancelEdit">取消</el-button>
      <el-button v-if="isEditing" type="primary" @click="saveConfig" :disabled="hasJsonError">
        保存
      </el-button>
      <el-button v-else @click="enableEdit">编辑</el-button>
      <el-button v-if="!isEditing" type="success" @click="handleConfigPush" :loading="pushLoading">
        配置推送
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { IotDeviceMessageMethodEnum } from '@/views/iot/utils/constants'
import { jsonParse } from '@/utils'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'DeviceDetailConfig' })

const props = defineProps<{
  device: DeviceVO
}>()

const emit = defineEmits<{
  (e: 'success'): void // 定义 success 事件，不需要参数
}>()

const message = useMessage()
const loading = ref(false) // 加载中
const pushLoading = ref(false) // 推送加载中
const config = ref<any>({}) // 只存储 config 字段
const hasJsonError = ref(false) // 是否有 JSON 格式错误

/** 监听 props.device 的变化，只更新 config 字段 */
watchEffect(() => {
  config.value = jsonParse(props.device.config)
})

const isEditing = ref(false) // 编辑状态
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

/** 配置推送处理函数 */
const handleConfigPush = async () => {
  try {
    // 二次确认
    await message.confirm('确定要推送配置到设备吗？此操作将远程更新设备配置。', '配置推送确认')

    pushLoading.value = true

    // 调用配置推送接口
    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id,
      method: IotDeviceMessageMethodEnum.CONFIG_PUSH.method,
      params: config.value
    })

    message.success('配置推送成功！')
  } catch (error) {
    if (error !== 'cancel') {
      message.error('配置推送失败！')
      console.error('配置推送错误:', error)
    }
  } finally {
    pushLoading.value = false
  }
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
const onError = (errors: any) => {
  if (isEmpty(errors)) {
    hasJsonError.value = false
    return
  }
  hasJsonError.value = true
}
</script>
