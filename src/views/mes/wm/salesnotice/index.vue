<template>
  <doc-alert title="【仓库】发货通知、销售出库、销售退货" url="https://doc.iocoder.cn/mes/wm/sales-out/" />

  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="通知单编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入通知单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="通知单名称" prop="name">
        <el-input
          v-model="queryParams.name"
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
        <MdClientSelect v-model="queryParams.clientId" class="!w-240px" />
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
      <el-table-column label="通知单编号" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="通知单名称" align="center" prop="name" min-width="150" />
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
          <dict-tag :type="DICT_TYPE.MES_WM_SALES_NOTICE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、删除 -->
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
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-sales-notice:delete']"
            v-if="scope.row.status === MesWmSalesNoticeStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- 待出库：执行出库 -->
          <el-button
            link
            type="success"
            @click="openForm('finish', scope.row.id)"
            v-hasPermi="['mes:wm-sales-notice:update']"
            v-if="scope.row.status === MesWmSalesNoticeStatusEnum.APPROVED"
          >
            执行出库
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
import { DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import { WmSalesNoticeApi, WmSalesNoticeVO } from '@/api/mes/wm/salesnotice'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import SalesNoticeForm from './SalesNoticeForm.vue'
import { MesWmSalesNoticeStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmSalesNotice' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<WmSalesNoticeVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  salesOrderCode: undefined,
  clientId: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单弹窗

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
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
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
onMounted(() => {
  getList()
})
</script>
