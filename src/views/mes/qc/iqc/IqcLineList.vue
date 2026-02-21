<!-- MES 来料检验单行 子列表（只读） -->
<template>
  <div>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="检测指标编码" align="center" prop="indicatorCode" width="140" />
      <el-table-column label="检测指标名称" align="center" prop="indicatorName" min-width="150" />
      <el-table-column label="检测指标类型" align="center" prop="indicatorType" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_INDEX_TYPE" :value="scope.row.indicatorType" />
        </template>
      </el-table-column>
      <el-table-column label="检测工具" align="center" prop="toolName" width="120" />
      <el-table-column label="检测方法" align="center" prop="checkMethod" min-width="180" />
      <el-table-column label="标准值" align="center" prop="standardValue" width="100" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="误差上限" align="center" prop="maxThreshold" width="100" />
      <el-table-column label="误差下限" align="center" prop="minThreshold" width="100" />
      <el-table-column label="致命缺陷数" align="center" prop="criticalQuantity" width="100" />
      <el-table-column label="严重缺陷数" align="center" prop="majorQuantity" width="100" />
      <el-table-column label="轻微缺陷数" align="center" prop="minorQuantity" width="100" />
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openDefectDialog(scope.row)"> 缺陷列表 </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 缺陷记录弹窗（内联编辑） -->
    <DefectRecordInlineList ref="defectListRef" @refresh="getList" />
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { QcIqcLineApi, QcIqcLineVO } from '@/api/mes/qc/iqc/line'
import DefectRecordInlineList from '@/views/mes/qc/defect/record/components/DefectRecordInlineList.vue'
import { MesQcTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'IqcLineList' })

const props = defineProps<{ iqcId: number }>()

const loading = ref(false) // 列表的加载中
const list = ref<QcIqcLineVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  iqcId: undefined as number | undefined
})
const defectListRef = ref() // 缺陷记录弹窗 Ref

/** 打开缺陷记录弹窗 */
const openDefectDialog = (row: QcIqcLineVO) => {
  defectListRef.value.open(MesQcTypeEnum.IQC, props.iqcId, row.id)
}

/** 查询列表 */
const getList = async () => {
  if (!props.iqcId) {
    return
  }
  queryParams.iqcId = props.iqcId
  loading.value = true
  try {
    const data = await QcIqcLineApi.getIqcLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 监听 iqcId 变化，重新加载列表 */
watch(
  () => props.iqcId,
  () => {
    queryParams.pageNo = 1
    getList()
  },
  { immediate: true }
)
</script>
