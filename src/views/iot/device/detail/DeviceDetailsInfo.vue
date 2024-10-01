<template>
  <ContentWrap>
    <el-collapse v-model="activeNames">
      <el-descriptions :column="3" title="设备信息">
        <el-descriptions-item label="产品名称">{{ product.name }}</el-descriptions-item>
        <el-descriptions-item label="ProductKey">
          {{ product.productKey }}
          <el-button @click="copyToClipboard(product.productKey)">复制</el-button>
        </el-descriptions-item>
        <el-descriptions-item label="设备类型">
          <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="product.deviceType" />
        </el-descriptions-item>
        <el-descriptions-item label="DeviceName">
          {{ device.deviceName }}
          <el-button @click="copyToClipboard(device.deviceName)">复制</el-button>
        </el-descriptions-item>
        <el-descriptions-item label="备注名称">{{ device.nickname }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(device.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="激活时间">
          {{ formatDate(device.activeTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="最后上线时间">
          {{ formatDate(device.lastOnlineTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATUS" :value="device.status" />
        </el-descriptions-item>
        <el-descriptions-item label="最后离线时间" :span="3">
          {{ formatDate(device.lastOfflineTime) }}
        </el-descriptions-item>
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

const message = useMessage() // 消息提示

const { product, device } = defineProps<{ product: ProductVO; device: DeviceVO }>() // 定义 Props

const emit = defineEmits(['refresh']) // 定义 Emits

const activeNames = ref(['basicInfo']) // 展示的折叠面板
const mqttDialogVisible = ref(false) // 定义 MQTT 弹框的可见性
const mqttParams = ref({
  mqttClientId: '',
  mqttUsername: '',
  mqttPassword: ''
}) // 定义 MQTT 参数对象

/** 复制到剪贴板方法 */
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    message.success('复制成功')
  })
}

/** 打开 MQTT 参数弹框的方法 */
const openMqttParams = () => {
  mqttParams.value = {
    mqttClientId: device.mqttClientId || 'N/A',
    mqttUsername: device.mqttUsername || 'N/A',
    mqttPassword: device.mqttPassword || 'N/A'
  }
  mqttDialogVisible.value = true
}

/** 关闭 MQTT 弹框的方法 */
const handleCloseMqttDialog = () => {
  mqttDialogVisible.value = false
}
</script>
