<!-- MES 检验结果列表子组件（嵌入 IQC 等质检单详情页） -->
<template>
  <div class="overflow-hidden">
    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain @click="handleAdd">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-col>
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="样品编号" align="center" prop="code" width="200" />
      <el-table-column label="物资SN" align="center" prop="sn" min-width="200" />
      <el-table-column label="备注" align="center" prop="remark" min-width="200" />
      <el-table-column label="操作" align="center" width="150" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 新增/修改弹窗 -->
    <QcIndicatorResultForm ref="formRef" :qc-id="qcId" :qc-type="qcType" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { QcIndicatorResultApi, QcIndicatorResultVO } from '@/api/mes/qc/indicatorresult'
import QcIndicatorResultForm from './QcIndicatorResultForm.vue'

defineOptions({ name: 'QcIndicatorResultList' })

const props = defineProps<{
  qcId: number
  qcType: number
}>()

const { t } = useI18n()
const message = useMessage()

const loading = ref(false) // 列表的加载中
const list = ref<QcIndicatorResultVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  qcId: undefined as number | undefined,
  qcType: undefined as number | undefined
}) // 搜索的表单
const formRef = ref() // 表单弹窗 Ref

/** 查询列表 */
const getList = async () => {
  if (!props.qcId) {
    return
  }
  queryParams.qcId = props.qcId
  queryParams.qcType = props.qcType
  loading.value = true
  try {
    const data = await QcIndicatorResultApi.getResultPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 新增操作 */
const handleAdd = () => {
  formRef.value.open('create')
}

/** 修改操作 */
const handleUpdate = (row: QcIndicatorResultVO) => {
  formRef.value.open('update', row.id)
}

/** 删除操作 */
const handleDelete = async (row: QcIndicatorResultVO) => {
  try {
    await message.delConfirm()
    await QcIndicatorResultApi.deleteResult(row.id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 监听 qcId 变化，重新加载列表 */
watch(
  () => props.qcId,
  () => {
    queryParams.pageNo = 1
    getList()
  },
  { immediate: true }
)
</script>
