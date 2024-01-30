<template>
  <ProductDetailsHeader :loading="loading" :product="product" @refresh="getProductData(id)" />
  <el-col>
    <el-tabs>
      <el-tab-pane label="详细资料">
        <ProductDetailsInfo :product="product" />
      </el-tab-pane>
      <el-tab-pane label="操作日志">
        <OperateLogV2 :log-list="logList" />
      </el-tab-pane>
    </el-tabs>
  </el-col>
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import { OperateLogV2VO } from '@/api/system/operatelog'
import * as ProductApi from '@/api/crm/product'
import ProductDetailsHeader from '@/views/crm/product/detail/ProductDetailsHeader.vue'
import ProductDetailsInfo from '@/views/crm/product/detail/ProductDetailsInfo.vue'
import { BizTypeEnum } from '@/api/crm/permission'
import { getOperateLogPage } from '@/api/crm/operateLog'

defineOptions({ name: 'CrmProductDetail' })

const route = useRoute()
const message = useMessage()
const id = Number(route.params.id) // 编号
const loading = ref(true) // 加载中
const product = ref<ProductApi.ProductVO>({} as ProductApi.ProductVO) // 详情

/** 获取详情 */
const getProductData = async (id: number) => {
  loading.value = true
  try {
    product.value = await ProductApi.getProduct(id)
    await getOperateLog(id)
  } finally {
    loading.value = false
  }
}

/** 获取操作日志 */
const logList = ref<OperateLogV2VO[]>([]) // 操作日志列表
const getOperateLog = async (productId: number) => {
  if (!productId) {
    return
  }
  const data = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_PRODUCT,
    bizId: productId
  })
  logList.value = data.list
}

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
