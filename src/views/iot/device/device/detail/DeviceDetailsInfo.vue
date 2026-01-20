<!-- 设备信息 -->
<template>
  <div>
    <ContentWrap>
      <el-descriptions :column="3" border>
          <el-descriptions-item label="产品名称">{{ product.name }}</el-descriptions-item>
          <el-descriptions-item label="ProductKey">{{ product.productKey }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">
            <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="product.deviceType" />
          </el-descriptions-item>
          <el-descriptions-item label="DeviceName">{{ device.deviceName }}</el-descriptions-item>
          <el-descriptions-item label="备注名称">{{ device.nickname }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="device.state" />
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(device.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="激活时间">
            {{ formatDate(device.activeTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后上线时间">
            {{ formatDate(device.onlineTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后离线时间">
            {{ formatDate(device.offlineTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="设备位置">
            <template v-if="hasLocation">
              <span class="mr-2">{{ device.longitude }}, {{ device.latitude }}</span>
              <el-button type="primary" link @click="openMapDialog">
                <Icon icon="ep:location" class="mr-1" />
                查看地图
              </el-button>
            </template>
            <span v-else class="text-[var(--el-text-color-secondary)]">暂无位置信息</span>
          </el-descriptions-item>
          <el-descriptions-item label="认证信息">
            <el-button type="primary" @click="handleAuthInfoDialogOpen" plain size="small">
              查看
            </el-button>
          </el-descriptions-item>
        </el-descriptions>
    </ContentWrap>

    <!-- 认证信息弹框 -->
    <Dialog
      title="设备认证信息"
      v-model="authDialogVisible"
      width="640px"
      :before-close="handleAuthInfoDialogClose"
    >
      <el-form :model="authInfo" label-width="120px">
        <el-form-item label="clientId">
          <el-input v-model="authInfo.clientId" readonly>
            <template #append>
              <el-button @click="copyToClipboard(authInfo.clientId)" type="primary">
                <Icon icon="ph:copy" />
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="username">
          <el-input v-model="authInfo.username" readonly>
            <template #append>
              <el-button @click="copyToClipboard(authInfo.username)" type="primary">
                <Icon icon="ph:copy" />
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="password">
          <el-input
            v-model="authInfo.password"
            readonly
            :type="authPasswordVisible ? 'text' : 'password'"
          >
            <template #append>
              <el-button @click="authPasswordVisible = !authPasswordVisible" type="primary">
                <Icon :icon="authPasswordVisible ? 'ph:eye-slash' : 'ph:eye'" />
              </el-button>
              <el-button @click="copyToClipboard(authInfo.password)" type="primary">
                <Icon icon="ph:copy" />
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleAuthInfoDialogClose">关闭</el-button>
      </template>
    </Dialog>

    <!-- 地图弹窗 -->
    <MapDialog ref="mapDialogRef" />
  </div>

  <!-- TODO 待开发：设备标签 -->
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { ProductVO } from '@/api/iot/product/product'
import { formatDate } from '@/utils/formatTime'
import { DeviceVO } from '@/api/iot/device/device'
import { DeviceApi, IotDeviceAuthInfoVO } from '@/api/iot/device/device'
import { MapDialog } from '@/components/Map'
import { ref, computed } from 'vue'
import { useClipboard } from '@vueuse/core'

const message = useMessage() // 消息提示
const { t } = useI18n() // 国际化

const { product, device } = defineProps<{ product: ProductVO; device: DeviceVO }>() // 定义 Props
const emit = defineEmits(['refresh']) // 定义 Emits

const authDialogVisible = ref(false) // 定义设备认证信息弹框的可见性
const authPasswordVisible = ref(false) // 定义密码可见性状态
const authInfo = ref<IotDeviceAuthInfoVO>({} as IotDeviceAuthInfoVO) // 定义设备认证信息对象
const mapDialogRef = ref() // 地图弹窗 Ref

/** 是否有位置信息 */
const hasLocation = computed(() => {
  return !!(device.longitude && device.latitude)
})

/** 打开地图弹窗 */
const openMapDialog = () => {
  mapDialogRef.value?.open(device.longitude, device.latitude)
}

/** 复制到剪贴板方法 */
const copyToClipboard = async (text: string) => {
  const { copy, copied, isSupported } = useClipboard({ legacy: true, source: text })
  if (!isSupported) {
    message.error(t('common.copyError'))
    return
  }
  await copy()
  if (unref(copied)) {
    message.success(t('common.copySuccess'))
  }
}

/** 打开设备认证信息弹框的方法 */
const handleAuthInfoDialogOpen = async () => {
  try {
    authInfo.value = await DeviceApi.getDeviceAuthInfo(device.id)
    // 显示设备认证信息弹框
    authDialogVisible.value = true
  } catch (error) {
    console.error('获取设备认证信息出错：', error)
    message.error('获取设备认证信息失败，请检查网络连接或联系管理员')
  }
}

/** 关闭设备认证信息弹框的方法 */
const handleAuthInfoDialogClose = () => {
  authDialogVisible.value = false
}
</script>
