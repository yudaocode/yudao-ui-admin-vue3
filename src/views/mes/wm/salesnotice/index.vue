<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="通知单编号" prop="noticeCode">
        <el-input
          v-model="queryParams.noticeCode"
          placeholder="请输入通知单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="通知单名称" prop="noticeName">
        <el-input
          v-model="queryParams.noticeName"
          placeholder="请输入通知单名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="销售订单编号" prop="salesOrderCode">
        <el-input
          v-model="queryParams.salesOrderCode"
          placeholder="请输入销售订单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="客户" prop="clientId">
        <el-select
          v-model="queryParams.clientId"
          placeholder="请选择客户"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="client in clientList"
            :key="client.id"
            :label="client.name"
            :value="client.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-sales-notice:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-sales-notice:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="通知单编号" align="center" prop="noticeCode" min-width="160">
        <template #default="scope">
          <el-link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.noticeCode }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="通知单名称" align="center" prop="noticeName" min-width="150" />
      <el-table-column label="销售订单编号" align="center" prop="salesOrderCode" min-width="140" />
      <el-table-column label="客户名称" align="center" prop="clientName" min-width="120" />
      <el-table-column
        label="发货日期"
        align="center"
        prop="salesDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="收货人" align="center" prop="recipientName" min-width="100" />
      <el-table-column label="联系方式" align="center" prop="recipientTelephone" min-width="120" />
      <el-table-column label="收货地址" align="center" prop="recipientAddress" min-width="200" />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_SALES_NOTICE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-sales-notice:update']"
            v-if="scope.row.status === MesWmSalesNoticeStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleSubmit(scope.row.id)"
            v-hasPermi="['mes:wm-sales-notice:update']"
            v-if="scope.row.status === MesWmSalesNoticeStatusEnum.PREPARE"
          >
            提交
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-sales-notice:delete']"
            v-if="scope.row.status === MesWmSalesNoticeStatusEnum.PREPARE"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <SalesNoticeForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { WmSalesNoticeApi, WmSalesNoticeVO } from '@/api/mes/wm/salesnotice'
import { MdClientApi } from '@/api/mes/md/client'
import SalesNoticeForm from './SalesNoticeForm.vue'
import { MesWmSalesNoticeStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmSalesNotice' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<WmSalesNoticeVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const clientList = ref<any[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  noticeCode: undefined,
  noticeName: undefined,
  salesOrderCode: undefined,
  clientId: undefined
})
const queryFormRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmSalesNoticeApi.getSalesNoticePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 新增/修改/详情 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 提交 */
const handleSubmit = async (id: number) => {
  try {
    await message.confirm('确认提交该发货通知单？')
    await WmSalesNoticeApi.submitSalesNotice(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmSalesNoticeApi.deleteSalesNotice(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmSalesNoticeApi.exportSalesNotice(queryParams)
    download.excel(data, '发货通知单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  clientList.value = await MdClientApi.getClientSimpleList()
  await getList()
})
</script>
