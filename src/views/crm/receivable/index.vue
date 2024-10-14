<template>
  <doc-alert title="【回款】回款管理、回款计划" url="https://doc.iocoder.cn/crm/receivable/" />
  <doc-alert title="【通用】数据权限" url="https://doc.iocoder.cn/crm/permission/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="回款编号" prop="no">
        <el-input
          v-model="queryParams.no"
          class="!w-240px"
          clearable
          placeholder="请输入回款编号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="客户名称" prop="customerId">
        <el-select
          v-model="queryParams.customerId"
          class="!w-240px"
          placeholder="请选择客户"
          @keyup.enter="handleQuery"
        >
          <el-option
            v-for="item in customerList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
        <el-button
          v-hasPermi="['crm:receivable:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
        <el-button
          v-hasPermi="['crm:receivable:export']"
          :loading="exportLoading"
          plain
          type="success"
          @click="handleExport"
        >
          <Icon class="mr-5px" icon="ep:download" />
          导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-tabs v-model="activeName" @tab-click="handleTabClick">
      <el-tab-pane label="我负责的" name="1" />
      <el-tab-pane label="我参与的" name="2" />
      <el-tab-pane label="下属负责的" name="3" />
    </el-tabs>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" fixed="left" label="回款编号" prop="no" width="180">
        <template #default="scope">
          <el-link :underline="false" type="primary" @click="openDetail(scope.row.id)">
            {{ scope.row.no }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" label="客户名称" prop="customerName" width="120">
        <template #default="scope">
          <el-link
            :underline="false"
            type="primary"
            @click="openCustomerDetail(scope.row.customerId)"
          >
            {{ scope.row.customerName }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" label="合同编号" prop="contractNo" width="180">
        <template #default="scope">
          <el-link
            :underline="false"
            type="primary"
            @click="openContractDetail(scope.row.contractId)"
          >
            {{ scope.row.contract.no }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter2"
        align="center"
        label="回款日期"
        prop="returnTime"
        width="150px"
      />
      <el-table-column
        align="center"
        label="回款金额(元)"
        prop="price"
        width="140"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column align="center" label="回款方式" prop="returnType" width="130px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE" :value="scope.row.returnType" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="备注" prop="remark" width="200" />
      <el-table-column
        align="center"
        label="合同金额（元）"
        prop="contract.totalPrice"
        width="140"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column align="center" label="负责人" prop="ownerUserName" width="120" />
      <el-table-column align="center" label="所属部门" prop="ownerUserDeptName" width="100px" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="更新时间"
        prop="updateTime"
        width="180px"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="180px"
      />
      <el-table-column align="center" label="创建人" prop="creatorName" width="120" />
      <el-table-column align="center" fixed="right" label="回款状态" prop="auditStatus" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_AUDIT_STATUS" :value="scope.row.auditStatus" />
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="180px">
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
            v-if="scope.row.auditStatus === 0"
            v-hasPermi="['crm:receivable:update']"
            link
            type="primary"
            @click="handleSubmit(scope.row)"
          >
            提交审核
          </el-button>
          <el-button
            v-else
            v-hasPermi="['crm:receivable:update']"
            link
            type="primary"
            @click="handleProcessDetail(scope.row)"
          >
            查看审批
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

  <!-- 表单弹窗：添加/修改 -->
  <ReceivableForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import download from '@/utils/download'
import * as ReceivableApi from '@/api/crm/receivable'
import ReceivableForm from './ReceivableForm.vue'
import * as CustomerApi from '@/api/crm/customer'
import { TabsPaneContext } from 'element-plus'
import { erpPriceTableColumnFormatter } from '@/utils'

defineOptions({ name: 'Receivable' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  sceneType: '1', // 默认和 activeName 相等
  no: undefined,
  customerId: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
const activeName = ref('1') // 列表 tab
const customerList = ref<CustomerApi.CustomerVO[]>([]) // 客户列表

/** tab 切换 */
const handleTabClick = (tab: TabsPaneContext) => {
  queryParams.sceneType = tab.paneName
  handleQuery()
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReceivableApi.getReceivablePage(queryParams)
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

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
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

/** 提交审核 **/
const handleSubmit = async (row: ReceivableApi.ReceivableVO) => {
  await message.confirm(`您确定提交编号为【${row.no}】的回款审核吗？`)
  await ReceivableApi.submitReceivable(row.id)
  message.success('提交审核成功！')
  await getList()
}

/** 查看审批 */
const handleProcessDetail = (row: ReceivableApi.ReceivableVO) => {
  push({ name: 'BpmProcessInstanceDetail', query: { id: row.processInstanceId } })
}

/** 打开回款详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmReceivableDetail', params: { id } })
}

/** 打开客户详情 */
const openCustomerDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

/** 打开合同详情 */
const openContractDetail = (id: number) => {
  push({ name: 'CrmContractDetail', params: { id } })
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await ReceivableApi.exportReceivable(queryParams)
    download.excel(data, '回款.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  // 获得客户列表
  customerList.value = await CustomerApi.getCustomerSimpleList()
})
</script>
