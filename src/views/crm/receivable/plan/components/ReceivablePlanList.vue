<template>
  <!-- 操作栏 -->
  <el-row justify="end">
    <el-button @click="openForm">
      <Icon class="mr-5px" icon="icon-park:income" />
      创建回款计划
    </el-button>
  </el-row>

  <!-- 列表 -->
  <ContentWrap class="mt-10px">
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="期数" fixed="left" align="center" prop="no">
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="openDetail(scope.row.id)">
            {{ scope.row.period }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="客户名称" align="center" prop="customerName" />
      <el-table-column label="合同编号" align="center" prop="contractNo" />
      <el-table-column
        label="计划还款金额（元）"
        align="center"
        prop="price"
        :formatter="fenToYuanFormat"
      />
      <el-table-column
        label="计划还款日期"
        align="center"
        prop="returnTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column align="center" label="计划还款方式" prop="auditStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE" :value="scope.row.returnType" />
        </template>
      </el-table-column>
      <el-table-column label="提前几日提醒" align="center" prop="remindDays" />
      <el-table-column label="备注" align="center" prop="remark" />
      <!-- TODO 芋艿：新建回款、编辑、删除 -->
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加 -->
  <ReceivableForm ref="formRef" @success="getList" />
</template>
<script setup lang="ts">
import * as ReceivablePlanApi from '@/api/crm/receivable/plan'
import ReceivableForm from './../ReceivablePlanForm.vue'
import { BizTypeEnum } from '@/api/crm/permission'
import { dateFormatter } from '@/utils/formatTime'
import { fenToYuanFormat } from '@/utils/formatter'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'CrmReceivablePlanList' })
const props = defineProps<{
  bizType: number // 业务类型
  bizId: number // 业务编号
}>()

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  customerId: undefined as unknown // 允许 undefined + number
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 置空参数
    queryParams.customerId = undefined
    // 执行查询
    let data = { list: [], total: 0 }
    switch (props.bizType) {
      case BizTypeEnum.CRM_CUSTOMER:
        queryParams.customerId = props.bizId
        data = await ReceivablePlanApi.getReceivablePlanPageByCustomer(queryParams)
        break
      default:
        return
    }
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 添加 */
const formRef = ref()
const openForm = () => {
  formRef.value.open('create')
}

/** 打开合同详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmReceivablePlanDetail', params: { id } })
}

/** 监听打开的 bizId + bizType，从而加载最新的列表 */
watch(
  () => [props.bizId, props.bizType],
  () => {
    handleQuery()
  },
  { immediate: true, deep: true }
)
</script>
