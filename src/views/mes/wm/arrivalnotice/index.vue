<template>
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
      <el-form-item label="采购订单编号" prop="purchaseOrderCode">
        <el-input
          v-model="queryParams.purchaseOrderCode"
          placeholder="请输入采购订单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="供应商" prop="vendorId">
        <el-select
          v-model="queryParams.vendorId"
          placeholder="请选择供应商"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="vendor in vendorList"
            :key="vendor.id"
            :label="vendor.name"
            :value="vendor.id"
          />
        </el-select>
      </el-form-item>
      <!-- TODO @AI：到货时间 -->
      <el-form-item label="单据状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择单据状态"
          clearable
          class="!w-240px"
        >
          <!-- TODO @AI：MES_WM_ARRIVAL_NOTICE_STATUS 枚举下 -->
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_ARRIVAL_NOTICE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
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
          v-hasPermi="['mes:wm-arrival-notice:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-arrival-notice:export']"
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
          <el-button link type="primary" @click="openLine(scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="通知单名称" align="center" prop="name" min-width="150" />
      <el-table-column
        label="采购订单编号"
        align="center"
        prop="purchaseOrderCode"
        min-width="140"
      />
      <el-table-column label="供应商名称" align="center" prop="vendorName" min-width="120" />
      <el-table-column
        label="到货日期"
        align="center"
        prop="arrivalDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="联系人" align="center" prop="contactName" min-width="100" />
      <el-table-column label="联系方式" align="center" prop="contactTelephone" min-width="120" />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_ARRIVAL_NOTICE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <!-- TODO @AI：到货时间，看看怎么没了； -->
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <!-- TODO @AI:fixed？ -->
      <el-table-column label="操作" align="center" width="220">
        <!-- TODO @AI：需要在 mes constants 里； -->
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-arrival-notice:update']"
            v-if="scope.row.status === 0"
          >
            编辑
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleSubmit(scope.row.id)"
            v-hasPermi="['mes:wm-arrival-notice:update']"
            v-if="scope.row.status === 0"
          >
            提交
          </el-button>
          <el-button
            link
            type="success"
            @click="handleApprove(scope.row.id)"
            v-hasPermi="['mes:wm-arrival-notice:update']"
            v-if="scope.row.status === 1"
          >
            审批
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-arrival-notice:delete']"
            v-if="scope.row.status === 0"
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

  <ArrivalNoticeForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { WmArrivalNoticeApi, WmArrivalNoticeVO } from '@/api/mes/wm/arrivalnotice'
import { MdVendorApi } from '@/api/mes/md/vendor'
import ArrivalNoticeForm from './ArrivalNoticeForm.vue'

// TODO @AI：/Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/system/user/index.vue 里的注释风格，参考下；

defineOptions({ name: 'MesWmArrivalNotice' })

const message = useMessage()
const { t } = useI18n()
const router = useRouter()

const loading = ref(true)
const list = ref<WmArrivalNoticeVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const vendorList = ref<any[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  purchaseOrderCode: undefined,
  vendorId: undefined,
  status: undefined
})
const queryFormRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmArrivalNoticeApi.getArrivalNoticePage(queryParams)
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

/** 新增/修改 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 打开明细行 */
const openLine = (noticeId: number) => {
  router.push({
    name: 'MesWmArrivalNoticeLine',
    query: { noticeId: String(noticeId) }
  })
}

/** 提交 */
const handleSubmit = async (id: number) => {
  try {
    await message.confirm('确认提交该到货通知单？')
    await WmArrivalNoticeApi.submitArrivalNotice(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 审批 */
const handleApprove = async (id: number) => {
  try {
    await message.confirm('确认审批通过该到货通知单？')
    await WmArrivalNoticeApi.approveArrivalNotice(id)
    message.success('审批成功')
    await getList()
  } catch {}
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmArrivalNoticeApi.deleteArrivalNotice(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmArrivalNoticeApi.exportArrivalNotice(queryParams)
    download.excel(data, '到货通知单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  vendorList.value = await MdVendorApi.getVendorSimpleList()
  await getList()
})
</script>
