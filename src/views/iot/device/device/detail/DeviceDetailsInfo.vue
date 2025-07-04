<!-- 设备信息 -->
<template>
  <div>
    <ContentWrap>
      <el-row :gutter="16">
        <!-- 左侧设备信息 -->
        <el-col :span="8">
          <el-card>
            <template #header>
              <div class="flex items-center">
                <Icon icon="ep:info-filled" class="mr-2 text-primary" />
                <span>设备信息</span>
              </div>
            </template>
            <div class="info-list">
              <div class="info-item">
                <span class="label">产品名称：</span>
                <span class="value">{{ product.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">ProductKey：</span>
                <span class="value">
                  {{ product.productKey }}
                  <el-button @click="copyToClipboard(product.productKey)" link>复制</el-button>
                </span>
              </div>
              <div class="info-item">
                <span class="label">设备类型：</span>
                <span class="value">
                  <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="product.deviceType" />
                </span>
              </div>
              <div class="info-item">
                <span class="label">定位类型：</span>
                <span class="value">
                  <dict-tag :type="DICT_TYPE.IOT_LOCATION_TYPE" :value="device.locationType" />
                </span>
              </div>
              <div class="info-item">
                <span class="label">DeviceName：</span>
                <span class="value">
                  {{ device.deviceName }}
                  <el-button @click="copyToClipboard(device.deviceName)" link>复制</el-button>
                </span>
              </div>
              <div class="info-item">
                <span class="label">备注名称：</span>
                <span class="value">{{ device.nickname }}</span>
              </div>
              <div class="info-item">
                <span class="label">创建时间：</span>
                <span class="value">{{ formatDate(device.createTime) }}</span>
              </div>
              <div class="info-item">
                <span class="label">当前状态：</span>
                <span class="value">
                  <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="device.state" />
                </span>
              </div>
              <div class="info-item">
                <span class="label">激活时间：</span>
                <span class="value">{{ formatDate(device.activeTime) }}</span>
              </div>
              <div class="info-item">
                <span class="label">最后上线时间：</span>
                <span class="value">{{ formatDate(device.onlineTime) }}</span>
              </div>
              <div class="info-item">
                <span class="label">最后离线时间：</span>
                <span class="value">{{ formatDate(device.offlineTime) }}</span>
              </div>
              <div class="info-item">
                <span class="label">认证信息：</span>
                <span class="value">
                  <el-button type="primary" @click="handleAuthInfoDialogOpen" plain>查看</el-button>
                </span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧地图 -->
        <el-col :span="16">
          <el-card class="map-card">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <Icon icon="ep:location" class="mr-2 text-primary" />
                  <span>设备位置</span>
                </div>
                <div class="text-[14px] text-[var(--el-text-color-secondary)]">
                  最后上线时间：{{ device.onlineTime ? formatDate(device.onlineTime, 'MM-DD HH:mm:ss') : '--' }}
                </div>
              </div>
            </template>
            <Map v-if="showMap" :center="getLocationString()" />
          </el-card>
        </el-col>
      </el-row>
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
  </div>

  <!-- TODO 待开发：设备标签 -->
  <!-- TODO 待开发：设备地图 -->
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { ProductVO } from '@/api/iot/product/product'
import { formatDate } from '@/utils/formatTime'
import { DeviceVO } from '@/api/iot/device/device'
import { DeviceApi, IotDeviceAuthInfoVO } from '@/api/iot/device/device'
import Map from '@/components/Map/index.vue'
import { ref, computed } from 'vue'

const message = useMessage() // 消息提示

const { product, device } = defineProps<{ product: ProductVO; device: DeviceVO }>() // 定义 Props
const emit = defineEmits(['refresh']) // 定义 Emits

const authDialogVisible = ref(false) // 定义设备认证信息弹框的可见性
const authPasswordVisible = ref(false) // 定义密码可见性状态
const authInfo = ref<IotDeviceAuthInfoVO>({} as IotDeviceAuthInfoVO) // 定义设备认证信息对象

// 控制地图显示的标志
const showMap = computed(() => {
  return !!(device.longitude && device.latitude)
})

// 获取位置字符串，用于地图组件
const getLocationString = () => {
  if (device.longitude && device.latitude) {
    return `${device.longitude},${device.latitude}`
  }
  return ''
}

/** 复制到剪贴板方法 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('复制成功')
  } catch (error) {
    message.error('复制失败')
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

<style scoped>
.info-list .info-item {
  display: flex;
  margin-bottom: 16px;
}

.info-list .info-item .label {
  width: 100px;
  color: var(--el-text-color-secondary);
}

.info-list .info-item .value {
  flex: 1;
  color: var(--el-text-color-primary);
}

.map-card {
  height: 100%;
}

.map-card :deep(.el-card__body) {
  height: calc(100% - 55px);
  padding: 0;
}
</style>
