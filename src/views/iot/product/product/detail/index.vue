<template>
  <ProductDetailsHeader :loading="loading" :product="product" @refresh="() => getProductData(id)" />
  <el-col>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="产品信息" name="info">
        <ProductDetailsInfo v-if="activeTab === 'info'" :product="product" />
      </el-tab-pane>
      <el-tab-pane label="Topic 类列表" name="topic">
        <ProductTopic v-if="activeTab === 'topic'" :product="product" />
      </el-tab-pane>
      <el-tab-pane label="功能定义" lazy name="thingModel">
        <IoTProductThingModel ref="thingModelRef" />
      </el-tab-pane>
      <el-tab-pane label="消息解析" name="message" />
      <el-tab-pane label="服务端订阅" name="subscription" />
    </el-tabs>
  </el-col>
</template>
<script lang="ts" setup>
import { ProductApi, ProductVO } from '@/api/iot/product/product'
import { DeviceApi } from '@/api/iot/device/device'
import ProductDetailsHeader from './ProductDetailsHeader.vue'
import ProductDetailsInfo from './ProductDetailsInfo.vue'
import ProductTopic from './ProductTopic.vue'
import IoTProductThingModel from '@/views/iot/thingmodel/index.vue'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useRouter } from 'vue-router'
import { IOT_PROVIDE_KEY } from '@/views/iot/utils/constants'

defineOptions({ name: 'IoTProductDetail' })

const { delView } = useTagsViewStore() // 视图操作
const { currentRoute } = useRouter()

const route = useRoute()
const message = useMessage()
const id = route.params.id // 编号
const loading = ref(true) // 加载中
const product = ref<ProductVO>({} as ProductVO) // 详情
const activeTab = ref('info') // 默认为 info 标签页

provide(IOT_PROVIDE_KEY.PRODUCT, product) // 提供产品信息给产品信息详情页的所有子组件

/** 获取详情 */
const getProductData = async (id: number) => {
  loading.value = true
  try {
    product.value = await ProductApi.getProduct(id)
  } finally {
    loading.value = false
  }
}

/** 查询设备数量 */
const getDeviceCount = async (productId: number) => {
  try {
    return await DeviceApi.getDeviceCount(productId)
  } catch (error) {
    console.error('Error fetching device count:', error, 'productId:', productId)
    return 0
  }
}

/** 初始化 */
onMounted(async () => {
  if (!id) {
    message.warning('参数错误，产品不能为空！')
    delView(unref(currentRoute))
    return
  }
  await getProductData(id)
  // 处理 tab 参数
  const { tab } = route.query
  if (tab) {
    activeTab.value = tab as string
  }
  // 查询设备数量
  if (product.value.id) {
    product.value.deviceCount = await getDeviceCount(product.value.id)
  }
})
</script>
