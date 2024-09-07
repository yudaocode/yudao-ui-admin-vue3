<template>
  <ProductDetailsHeader :loading="loading" :product="product" @refresh="getProductData(id)" />
  <el-col>
    <el-tabs>
      <el-tab-pane label="详细资料">
        <ProductDetailsInfo :product="product" />
      </el-tab-pane>
      <el-tab-pane label="物模型">
        <!--        <ProductDetailsModel :product="product" />-->
      </el-tab-pane>
    </el-tabs>
  </el-col>
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import { ProductApi, ProductVO } from '@/api/iot/product'
import ProductDetailsHeader from '@/views/iot/product/detail/ProductDetailsHeader.vue'
import ProductDetailsInfo from '@/views/iot/product/detail/ProductDetailsInfo.vue'

defineOptions({ name: 'IotProductDetail' })

const route = useRoute()
const message = useMessage()
const id = Number(route.params.id) // 编号
const loading = ref(true) // 加载中
const product = ref<ProductVO>({} as ProductVO) // 详情

/** 获取详情 */
const getProductData = async (id: number) => {
  loading.value = true
  try {
    product.value = await ProductApi.getProduct(id)
  } finally {
    loading.value = false
  }
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
  await getProductData(id)
})
</script>
