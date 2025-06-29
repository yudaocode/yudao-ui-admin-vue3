<template>
  <DeviceDetailsHeader
    :loading="loading"
    :product="product"
    :device="device"
    @refresh="getDeviceData"
  />
  <el-col>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="设备信息" name="info">
        <DeviceDetailsInfo v-if="activeTab === 'info'" :product="product" :device="device" />
      </el-tab-pane>
      <el-tab-pane label="物模型数据" name="model">
        <DeviceDetailsThingModel
          v-if="activeTab === 'model'"
          :device-id="device.id"
          :thing-model-list="thingModelList"
        />
      </el-tab-pane>
      <el-tab-pane label="子设备管理" v-if="product.deviceType === DeviceTypeEnum.GATEWAY" />
      <el-tab-pane label="设备消息" name="log">
        <DeviceDetailsMessage v-if="activeTab === 'log'" :device-id="device.id" />
      </el-tab-pane>
      <el-tab-pane label="模拟设备" name="simulator">
        <DeviceDetailsSimulator
          v-if="activeTab === 'simulator'"
          :product="product"
          :device="device"
          :thing-model-list="thingModelList"
        />
      </el-tab-pane>
      <el-tab-pane label="设备配置" name="config">
        <DeviceDetailConfig
          v-if="activeTab === 'config'"
          :device="device"
          @success="getDeviceData"
        />
      </el-tab-pane>
    </el-tabs>
  </el-col>
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { DeviceTypeEnum, ProductApi, ProductVO } from '@/api/iot/product/product'
import { ThingModelApi, ThingModelData } from '@/api/iot/thingmodel'
import DeviceDetailsHeader from './DeviceDetailsHeader.vue'
import DeviceDetailsInfo from './DeviceDetailsInfo.vue'
import DeviceDetailsThingModel from './DeviceDetailsThingModel.vue'
import DeviceDetailsMessage from './DeviceDetailsMessage.vue'
import DeviceDetailsSimulator from './DeviceDetailsSimulator.vue'
import DeviceDetailConfig from './DeviceDetailConfig.vue'

defineOptions({ name: 'IoTDeviceDetail' })

const route = useRoute()
const message = useMessage()
const id = Number(route.params.id) // 将字符串转换为数字
const loading = ref(true) // 加载中
const product = ref<ProductVO>({} as ProductVO) // 产品详情
const device = ref<DeviceVO>({} as DeviceVO) // 设备详情
const activeTab = ref('info') // 默认激活的标签页
const thingModelList = ref<ThingModelData[]>([]) // 物模型列表数据

/** 获取设备详情 */
const getDeviceData = async () => {
  loading.value = true
  try {
    device.value = await DeviceApi.getDevice(id)
    await getProductData(device.value.productId)
    await getThingModelList(device.value.productId)
  } finally {
    loading.value = false
  }
}

/** 获取产品详情 */
const getProductData = async (id: number) => {
  product.value = await ProductApi.getProduct(id)
}

/** 获取物模型列表 */
const getThingModelList = async (productId: number) => {
  try {
    const data = await ThingModelApi.getThingModelList({
      productId: productId
    })
    thingModelList.value = data || []
  } catch (error) {
    console.error('获取物模型列表失败:', error)
    thingModelList.value = []
  }
}

/** 初始化 */
const { delView } = useTagsViewStore() // 视图操作
const router = useRouter() // 路由
const { currentRoute } = router
onMounted(async () => {
  if (!id) {
    message.warning('参数错误，产品不能为空！')
    delView(unref(currentRoute))
    return
  }
  await getDeviceData()
  activeTab.value = (route.query.tab as string) || 'info'
})
</script>
