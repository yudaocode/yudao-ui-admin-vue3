<template>
  <ContentWrap>
    <el-collapse v-model="activeNames">
      <el-descriptions :column="3" title="设备信息">
        <el-descriptions-item label="产品名称">{{ product.name }}</el-descriptions-item>
        <el-descriptions-item label="ProductKey"
          >{{ product.productKey }}
          <el-button @click="copyToClipboard(product.productKey)">复制</el-button>
        </el-descriptions-item>
        <el-descriptions-item label="设备类型">
          <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="product.deviceType" />
        </el-descriptions-item>
        <el-descriptions-item label="DeviceName"
          >{{ device.deviceName }}
          <el-button @click="copyToClipboard(device.deviceName)">复制</el-button>
        </el-descriptions-item>
        <el-descriptions-item label="备注名称">{{ device.nickname }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{
          formatDate(device.createTime)
        }}</el-descriptions-item>
        <el-descriptions-item label="激活时间">{{
          formatDate(device.activeTime)
        }}</el-descriptions-item>
        <el-descriptions-item label="最后上线时间">{{
          formatDate(device.lastOnlineTime)
        }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATUS" :value="device.status" />
        </el-descriptions-item>
        <el-descriptions-item label="最后离线时间" :span="3">{{
          formatDate(device.lastOfflineTime)
        }}</el-descriptions-item>
        <el-descriptions-item label="MQTT 连接参数">
          <el-button type="primary" @click="openMqttParams">查看</el-button>
        </el-descriptions-item>
      </el-descriptions>
    </el-collapse>

    <!-- MQTT 连接参数弹框 -->
    <Dialog
      title="MQTT 连接参数"
      v-model="mqttDialogVisible"
      width="50%"
      :before-close="handleCloseMqttDialog"
    >
      <el-form :model="mqttParams" label-width="120px">
        <el-form-item label="clientId">
          <el-input v-model="mqttParams.mqttClientId" readonly>
            <template #append>
              <el-button @click="copyToClipboard(mqttParams.mqttClientId)" type="primary">
                <Icon icon="ph:copy" />
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="username">
          <el-input v-model="mqttParams.mqttUsername" readonly>
            <template #append>
              <el-button @click="copyToClipboard(mqttParams.mqttUsername)" type="primary">
                <Icon icon="ph:copy" />
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="passwd">
          <el-input v-model="mqttParams.mqttPassword" readonly type="password">
            <template #append>
              <el-button @click="copyToClipboard(mqttParams.mqttPassword)" type="primary">
                <Icon icon="ph:copy" />
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mqttDialogVisible = false">关闭</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import { ProductVO } from '@/api/iot/product'
import { formatDate } from '@/utils/formatTime'
import { DeviceVO } from '@/api/iot/device'

// 消息提示
const message = useMessage()

// 路由实例
const router = useRouter()

// 定义 Props
const { product, device } = defineProps<{ product: ProductVO; device: DeviceVO }>()

// 定义 Emits
const emit = defineEmits(['refresh'])

// 展示的折叠面板
const activeNames = ref(['basicInfo'])

// 复制到剪贴板方法
const copyToClipboard = async (text: string) => {
  if (!navigator.clipboard) {
    // 浏览器不支持 Clipboard API，使用回退方法
    const textarea = document.createElement('textarea')
    textarea.value = text
    // 防止页面滚动
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '0'
    textarea.style.width = '2em'
    textarea.style.height = '2em'
    textarea.style.padding = '0'
    textarea.style.border = 'none'
    textarea.style.outline = 'none'
    textarea.style.boxShadow = 'none'
    textarea.style.background = 'transparent'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    try {
      const successful = document.execCommand('copy')
      if (successful) {
        message.success('复制成功！')
      } else {
        message.error('复制失败，请手动复制')
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err)
      message.error('复制失败，请手动复制')
    }

    document.body.removeChild(textarea)
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    message.success('复制成功！')
  } catch (err) {
    console.error('Async: Could not copy text: ', err)
    message.error('复制失败，请手动复制')
  }
}

// 定义 MQTT 弹框的可见性
const mqttDialogVisible = ref(false)

// 定义 MQTT 参数对象
const mqttParams = ref({
  mqttClientId: '',
  mqttUsername: '',
  mqttPassword: ''
})

// 打开 MQTT 参数弹框的方法
const openMqttParams = () => {
  mqttParams.value = {
    mqttClientId: device.mqttClientId || 'N/A',
    mqttUsername: device.mqttUsername || 'N/A',
    mqttPassword: device.mqttPassword || 'N/A'
  }
  mqttDialogVisible.value = true
}

// 关闭 MQTT 弹框的方法
const handleCloseMqttDialog = () => {
  mqttDialogVisible.value = false
}
</script>
