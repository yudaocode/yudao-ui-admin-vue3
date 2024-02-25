<template>
  <!-- 操作栏 -->
  <el-row justify="end">
    <el-button @click="openForm('create', undefined)">
      <Icon class="mr-5px" icon="icon-park:income" />
      创建回款计划
    </el-button>
  </el-row>

  <!-- 列表 -->
  <ContentWrap class="mt-10px">
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" label="客户名称" prop="customerName" width="150px" />
      <el-table-column align="center" label="合同编号" prop="contractNo" width="200px" />
      <el-table-column align="center" label="期数" prop="period" />
      <el-table-column
        align="center"
        label="计划回款(元)"
        prop="price"
        width="120"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        :formatter="dateFormatter2"
        align="center"
        label="计划回款日期"
        prop="returnTime"
        width="180px"
      />
      <el-table-column align="center" label="提前几天提醒" prop="remindDays" width="150" />
      <el-table-column
        :formatter="dateFormatter2"
        align="center"
        label="提醒日期"
        prop="remindTime"
        width="180px"
      />
      <el-table-column label="负责人" prop="ownerUserName" width="120" />
      <el-table-column align="center" label="备注" prop="remark" />
      <el-table-column align="center" fixed="right" label="操作" width="200px">
        <template #default="scope">
          <el-button
            v-hasPermi="['crm:receivable:create']"
            link
            type="primary"
            @click="createReceivable(scope.row)"
            :disabled="scope.row.receivableId"
          >
            创建回款
          </el-button>
          <el-button
            v-hasPermi="['crm:receivable-plan:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['crm:receivable-plan:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加 -->
  <ReceivableForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import * as ReceivablePlanApi from '@/api/crm/receivable/plan'
import ReceivableForm from './../ReceivablePlanForm.vue'
import { dateFormatter2 } from '@/utils/formatTime'
import { erpPriceTableColumnFormatter } from '@/utils'

defineOptions({ name: 'CrmReceivablePlanList' })
const props = defineProps<{
  customerId?: number // 客户编号
  contractId?: number // 合同编号
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  customerId: undefined as unknown, // 允许 undefined + number
  contractId: undefined as unknown // 允许 undefined + number
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    if (props.customerId && !props.contractId) {
      queryParams.customerId = props.customerId
    } else if (props.customerId && props.contractId) {
      // 如果是合同的话客户编号也需要带上因为权限基于客户
      queryParams.customerId = props.customerId
      queryParams.contractId = props.contractId
    }
    const data = await ReceivablePlanApi.getReceivablePlanPageByCustomer(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  // 置空参数
  queryParams.customerId = undefined
  queryParams.contractId = undefined
  getList()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, props.customerId, props.contractId)
}

/** 创建回款 */
const emits = defineEmits<{
  (e: 'createReceivable', v: ReceivablePlanApi.ReceivablePlanVO)
}>()
const createReceivable = (row: ReceivablePlanApi.ReceivablePlanVO) => {
  emits('createReceivable', row)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ReceivablePlanApi.deleteReceivablePlan(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 监听打开的 customerId + contractId，从而加载最新的列表 */
watch(
  () => [props.customerId, props.contractId],
  (newVal) => {
    // 保证至少客户编号有值
    if (!newVal[0]) {
      return
    }
    handleQuery()
  },
  { immediate: true, deep: true }
)
</script>
