<template>
  <doc-alert title="【合同】合同管理、合同提醒" url="https://doc.iocoder.cn/crm/contract/" />
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
      <el-form-item label="合同编号" prop="no">
        <el-input
          v-model="queryParams.no"
          class="!w-240px"
          clearable
          placeholder="请输入合同编号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="合同名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入合同名称"
          @keyup.enter="handleQuery"
        />
        <el-form-item label="客户" prop="customerId">
          <el-select
            v-model="queryParams.customerId"
            class="!w-240px"
            clearable
            lable-key="name"
            placeholder="请选择客户"
            value-key="id"
            @keyup.enter="handleQuery"
          >
            <el-option
              v-for="item in customerList"
              :key="item.id"
              :label="item.name"
              :value="item.id!"
            />
          </el-select>
        </el-form-item>
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
        <el-button v-hasPermi="['crm:contract:create']" type="primary" @click="openForm('create')">
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
        <el-button
          v-hasPermi="['crm:contract:export']"
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
      <el-table-column align="center" fixed="left" label="合同编号" prop="no" width="180" />
      <el-table-column align="center" fixed="left" label="合同名称" prop="name" width="160">
        <template #default="scope">
          <el-link :underline="false" type="primary" @click="openDetail(scope.row.id)">
            {{ scope.row.name }}
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
      <el-table-column align="center" label="商机名称" prop="businessName" width="130">
        <template #default="scope">
          <el-link
            :underline="false"
            type="primary"
            @click="openBusinessDetail(scope.row.businessId)"
          >
            {{ scope.row.businessName }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="合同金额（元）"
        prop="totalPrice"
        width="140"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        align="center"
        label="下单时间"
        prop="orderDate"
        width="120"
        :formatter="dateFormatter2"
      />
      <el-table-column
        align="center"
        label="合同开始时间"
        prop="startTime"
        width="120"
        :formatter="dateFormatter2"
      />
      <el-table-column
        align="center"
        label="合同结束时间"
        prop="endTime"
        width="120"
        :formatter="dateFormatter2"
      />
      <el-table-column align="center" label="客户签约人" prop="contactName" width="130">
        <template #default="scope">
          <el-link
            :underline="false"
            type="primary"
            @click="openContactDetail(scope.row.signContactId)"
          >
            {{ scope.row.signContactName }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" label="公司签约人" prop="signUserName" width="130" />
      <el-table-column align="center" label="备注" prop="remark" width="200" />
      <el-table-column
        align="center"
        label="已回款金额（元）"
        prop="totalReceivablePrice"
        width="140"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        align="center"
        label="未回款金额（元）"
        prop="totalReceivablePrice"
        width="140"
        :formatter="erpPriceTableColumnFormatter"
      >
        <template #default="scope">
          {{ erpPriceInputFormatter(scope.row.totalPrice - scope.row.totalReceivablePrice) }}
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="最后跟进时间"
        prop="contactLastTime"
        width="180px"
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
      <el-table-column align="center" fixed="right" label="合同状态" prop="auditStatus" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_AUDIT_STATUS" :value="scope.row.auditStatus" />
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="250">
        <template #default="scope">
          <el-button
            v-if="scope.row.auditStatus === 0"
            v-hasPermi="['crm:contract:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-if="scope.row.auditStatus === 0"
            v-hasPermi="['crm:contract:update']"
            link
            type="primary"
            @click="handleSubmit(scope.row)"
          >
            提交审核
          </el-button>
          <el-button
            v-else
            link
            v-hasPermi="['crm:contract:update']"
            type="primary"
            @click="handleProcessDetail(scope.row)"
          >
            查看审批
          </el-button>
          <el-button
            v-hasPermi="['crm:contract:query']"
            link
            type="primary"
            @click="openDetail(scope.row.id)"
          >
            详情
          </el-button>
          <el-button
            v-hasPermi="['crm:contract:delete']"
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
  <ContractForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import download from '@/utils/download'
import * as ContractApi from '@/api/crm/contract'
import ContractForm from './ContractForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { erpPriceInputFormatter, erpPriceTableColumnFormatter } from '@/utils'
import * as CustomerApi from '@/api/crm/customer'
import { TabsPaneContext } from 'element-plus'

defineOptions({ name: 'CrmContract' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  sceneType: '1', // 默认和 activeName 相等
  name: null,
  customerId: null,
  orderDate: [],
  no: null
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
    const data = await ContractApi.getContractPage(queryParams)
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
    await ContractApi.deleteContract(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await ContractApi.exportContract(queryParams)
    download.excel(data, '合同.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 提交审核 **/
const handleSubmit = async (row: ContractApi.ContractVO) => {
  await message.confirm(`您确定提交【${row.name}】审核吗？`)
  await ContractApi.submitContract(row.id)
  message.success('提交审核成功！')
  await getList()
}

/** 查看审批 */
const handleProcessDetail = (row: ContractApi.ContractVO) => {
  push({ name: 'BpmProcessInstanceDetail', query: { id: row.processInstanceId } })
}

/** 打开合同详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmContractDetail', params: { id } })
}

/** 打开客户详情 */
const openCustomerDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

/** 打开联系人详情 */
const openContactDetail = (id: number) => {
  push({ name: 'CrmContactDetail', params: { id } })
}

/** 打开商机详情 */
const openBusinessDetail = (id: number) => {
  push({ name: 'CrmBusinessDetail', params: { id } })
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  customerList.value = await CustomerApi.getCustomerSimpleList()
})
</script>
