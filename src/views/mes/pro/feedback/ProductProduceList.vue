<!-- 产品产出记录行列表（只读，带分页） -->
<template>
  <div>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="物资编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物资名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="产出数量" align="center" prop="quantity" min-width="100" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" min-width="80" />
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column label="质量状态" align="center" prop="qualityStatus" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="scope.row.qualityStatus" />
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </div>
</template>

<script lang="ts" setup>
import { getProductProduceLinePage } from '@/api/mes/wm/productproduce/line'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'ProductProduceList' })

const props = defineProps<{
  feedbackId: number
}>()

const loading = ref(false) // 列表的加载中
const list = ref<any[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  feedbackId: undefined as number | undefined
})

/** 加载产出行数据 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.feedbackId = props.feedbackId
    const data = await getProductProduceLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** feedbackId 变化时重新加载 */
watch(
  () => props.feedbackId,
  (val) => {
    if (val) {
      queryParams.pageNo = 1
      getList()
    } else {
      list.value = []
      total.value = 0
    }
  },
  { immediate: true }
)
</script>
