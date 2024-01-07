<template>
  <el-card shadow="never">
    <template #header>
      <!-- 标题 -->
      <div class="flex flex-row items-center justify-between">
        <CardTitle title="商品排行" />
        <!-- 查询条件 -->
        <ShortcutDateRangePicker ref="shortcutDateRangePicker" @change="handleDateRangeChange" />
      </div>
    </template>
    <!-- 排行列表 -->
    <el-table v-loading="loading" :data="list" @sort-change="handleSortChange">
      <el-table-column label="商品ID" prop="spuId" min-width="70" />
      <el-table-column label="商品图片" align="center" prop="picUrl" width="80">
        <template #default="{ row }">
          <el-image
            :src="row.picUrl"
            :preview-src-list="[row.picUrl]"
            class="h-30px w-30px"
            preview-teleported
          />
        </template>
      </el-table-column>
      <el-table-column label="商品名称" prop="name" min-width="200" :show-overflow-tooltip="true" />
      <el-table-column label="浏览量" prop="browseCount" min-width="90" sortable="custom" />
      <el-table-column label="访客数" prop="browseUserCount" min-width="90" sortable="custom" />
      <el-table-column label="加购件数" prop="cartCount" min-width="105" sortable="custom" />
      <el-table-column label="下单件数" prop="orderCount" min-width="105" sortable="custom" />
      <el-table-column label="支付件数" prop="orderPayCount" min-width="105" sortable="custom" />
      <el-table-column label="支付金额" prop="orderPayPrice" min-width="105" sortable="custom" />
      <el-table-column label="收藏数" prop="favoriteCount" min-width="90" sortable="custom" />
      <el-table-column
        label="访客-支付转化率(%)"
        prop="browseConvertPercent"
        min-width="180"
        sortable="custom"
        :formatter="formatConvertRate"
      />
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getSpuList"
    />
  </el-card>
</template>
<script lang="ts" setup>
import { ProductStatisticsApi, ProductStatisticsVO } from '@/api/mall/statistics/product'
import { CardTitle } from '@/components/Card'
import { buildSortingField } from '@/utils'

/** 商品排行 */
defineOptions({ name: 'ProductRank' })

// 格式化：访客-支付转化率
const formatConvertRate = (row: ProductStatisticsVO) => {
  return `${row.browseConvertPercent}%`
}

const handleSortChange = (params: any) => {
  queryParams.sortingFields = [buildSortingField(params)]
  getSpuList()
}

const handleDateRangeChange = (times: any[]) => {
  queryParams.times = times as []
  getSpuList()
}

const shortcutDateRangePicker = ref()
// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  times: [],
  sortingFields: {}
})
const loading = ref(false) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<ProductStatisticsVO[]>([]) // 列表的数据

/** 查询商品列表 */
const getSpuList = async () => {
  loading.value = true
  try {
    const data = await ProductStatisticsApi.getProductStatisticsRankPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  await getSpuList()
})
</script>
<style lang="scss" scoped></style>
