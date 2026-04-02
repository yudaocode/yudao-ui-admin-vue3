<!-- 设备台账 - 维修工单列表（嵌入设备详情 Tab） -->
<template>
  <div class="overflow-hidden">
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="维护单编号" align="center" prop="code" width="120" />
      <el-table-column label="维修单名称" align="center" prop="name" min-width="120" />
      <el-table-column
        label="保修日期"
        align="center"
        prop="requireDate"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column
        label="维修完成日期"
        align="center"
        prop="finishDate"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column
        label="验收日期"
        align="center"
        prop="confirmDate"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="维修人员" align="center" prop="acceptedUserNickname" width="100" />
      <el-table-column label="验收人员" align="center" prop="confirmUserNickname" width="100" />
      <el-table-column label="维修结果" align="center" prop="result" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_REPAIR_RESULT" :value="scope.row.result" />
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_REPAIR_STATUS" :value="scope.row.status" />
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
import { DvRepairApi } from '@/api/mes/dv/repair'

defineOptions({ name: 'MachineryRepairList' })

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
    const data = await DvRepairApi.getRepairPage(queryParams)
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
