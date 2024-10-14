<template>
  <!-- 操作栏 -->
  <el-row justify="end">
    <el-button @click="openForm('create')">
      <Icon class="mr-5px" icon="icon-park:income-one" />
      创建回款
    </el-button>
  </el-row>

  <!-- 列表 -->
  <ContentWrap class="mt-10px">
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" label="回款编号" prop="no" />
      <el-table-column align="center" label="客户" prop="customerName" />
      <el-table-column align="center" label="合同" prop="contract.no" />
      <el-table-column
        :formatter="dateFormatter2"
        align="center"
        label="回款日期"
        prop="returnTime"
        width="150px"
      />
      <el-table-column align="center" label="回款方式" prop="returnType" width="130px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE" :value="scope.row.returnType" />
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="回款金额(元)"
        prop="price"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column align="center" label="负责人" prop="ownerUserName" />
      <el-table-column align="center" label="备注" prop="remark" />
      <el-table-column align="center" fixed="right" label="操作" width="130px">
        <template #default="scope">
          <el-button
            v-hasPermi="['crm:receivable:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['crm:receivable:delete']"
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
import * as ReceivableApi from '@/api/crm/receivable'
import ReceivableForm from './../ReceivableForm.vue'
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { erpPriceTableColumnFormatter } from '@/utils'

defineOptions({ name: 'CrmReceivableList' })
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
    const data = await ReceivableApi.getReceivablePageByCustomer(queryParams)
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
  formRef.value.open(type, id, {
    customerId: props.customerId,
    contractId: props.contractId
  })
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ReceivableApi.deleteReceivable(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 从回款计划创建回款 */
const createReceivable = (planData: any) => {
  const data = planData as unknown as ReceivablePlanApi.ReceivablePlanVO
  formRef.value.open('create', undefined, data)
}
defineExpose({ createReceivable })

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
