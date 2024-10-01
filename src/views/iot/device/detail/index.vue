<template>
  <DeviceDetailsHeader
    :loading="loading"
    :product="product"
    :device="device"
    @refresh="getDeviceData(id)"
  />
  <el-col>
    <el-tabs>
      <el-tab-pane label="设备信息">
        <DeviceDetailsInfo :product="product" :device="device" />
      </el-tab-pane>
      <el-tab-pane label="Topic 列表" />
      <el-tab-pane label="物模型数据" />
      <el-tab-pane label="子设备管理" />
    </el-tabs>
  </el-col>
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import { DeviceApi, DeviceVO } from '@/api/iot/device'
import { ProductApi, ProductVO } from '@/api/iot/product'
import DeviceDetailsHeader from '@/views/iot/device/detail/DeviceDetailsHeader.vue'
import DeviceDetailsInfo from '@/views/iot/device/detail/DeviceDetailsInfo.vue'

defineOptions({ name: 'IoTDeviceDetail' })

const route = useRoute()
const message = useMessage()
const id = Number(route.params.id) // 编号
const loading = ref(true) // 加载中
const product = ref<ProductVO>({} as ProductVO) // 产品详情
const device = ref<DeviceVO>({} as DeviceVO) // 设备详情

/** 获取设备详情 */
const getDeviceData = async (id: number) => {
  loading.value = true
  try {
    device.value = await DeviceApi.getDevice(id)
    console.log(product.value)
    await getProductData(device.value.productId)
  } finally {
    loading.value = false
  }
}

/** 获取产品详情 */
const getProductData = async (id: number) => {
  product.value = await ProductApi.getProduct(id)
  console.log(product.value)
}

/** 获取物模型 */

/** 初始化 */
const { delView } = useTagsViewStore() // 视图操作
const { currentRoute } = useRouter() // 路由
onMounted(async () => {
  if (!id) {
    message.warning('参数错误，产品不能为空！')
    delView(unref(currentRoute))
    return
  }
  await getDeviceData(id)
})
</script>
