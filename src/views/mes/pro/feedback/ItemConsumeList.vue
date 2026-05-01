<!-- 物料消耗记录行列表（只读，带分页） -->
<!-- DONE @AI：挪到 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/pro/feedback；不作为 components -->
<template>
  <div class="overflow-hidden">
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="物资编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物资名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="消耗数量" align="center" prop="quantity" min-width="100" />
      <el-table-column label="单位" align="center" prop="unitName" min-width="80" />
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
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
import { getItemConsumeLinePage } from '@/api/mes/wm/itemconsume/line'

defineOptions({ name: 'ItemConsumeList' })

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

/** 加载消耗行数据 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.feedbackId = props.feedbackId
    const data = await getItemConsumeLinePage(queryParams)
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
