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
        <MdVendorSelect v-model="queryParams.vendorId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="到货日期" prop="arrivalDate">
        <el-date-picker
          v-model="queryParams.arrivalDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
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
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
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
      <el-table-column label="联系人" align="center" prop="contactName" min-width="100" />
      <el-table-column label="联系方式" align="center" prop="contactTelephone" min-width="120" />
      <el-table-column
        label="到货日期"
        align="center"
        prop="arrivalDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_ARRIVAL_NOTICE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-arrival-notice:update']"
            v-if="scope.row.status === MesWmArrivalNoticeStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-arrival-notice:delete']"
            v-if="scope.row.status === MesWmArrivalNoticeStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- TODO @AI：【待入库】后，需要前往哪里操作？是不是得有个提示给用户 -->
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
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import { WmArrivalNoticeApi, WmArrivalNoticeVO } from '@/api/mes/wm/arrivalnotice'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import ArrivalNoticeForm from './ArrivalNoticeForm.vue'
import { MesWmArrivalNoticeStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmArrivalNotice' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<WmArrivalNoticeVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  purchaseOrderCode: undefined,
  vendorId: undefined,
  arrivalDate: undefined
})
const queryFormRef = ref() // 搜索的表单

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

/** 新增/修改/详情 */
const formRef = ref() // 表单弹窗
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
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
onMounted(() => {
  getList()
})
</script>
