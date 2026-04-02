<!-- 设备台账 - 保养记录列表（嵌入设备详情 Tab） -->
<template>
  <div class="overflow-hidden">
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <!-- TODO @AI：计划编码、计划名称、开始时间、结束日期、频率、状态 -->
      <el-table-column label="计划名称" align="center" prop="planName" min-width="120" />
      <el-table-column
        label="保养时间"
        align="center"
        prop="maintenTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="保养人" align="center" prop="nickname" width="100" />
      <el-table-column label="设备编码" align="center" prop="machineryCode" width="120" />
      <el-table-column label="设备名称" align="center" prop="machineryName" width="120" />
      <el-table-column label="品牌" align="center" prop="machineryBrand" width="100" />
      <el-table-column label="规格型号" align="center" prop="machinerySpec" width="120" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_MAINTEN_RECORD_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { DvMaintenRecordApi } from '@/api/mes/dv/maintenrecord'

defineOptions({ name: 'MachineryMaintenRecordList' })

const props = defineProps<{
  machineryId: number
}>()

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  machineryId: undefined as number | undefined
})

/** 查询列表 */
const getList = async () => {
  if (!queryParams.machineryId) return
  loading.value = true
  try {
    const data = await DvMaintenRecordApi.getMaintenRecordPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 监听 machineryId 变化，自动加载 */
watch(
  () => props.machineryId,
  (val) => {
    queryParams.machineryId = val
    queryParams.pageNo = 1
    getList()
  },
  { immediate: true }
)
</script>
