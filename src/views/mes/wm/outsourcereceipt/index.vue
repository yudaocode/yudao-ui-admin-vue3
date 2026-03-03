<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="入库单编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入入库单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="入库单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入入库单名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="供应商" prop="vendorId">
        <MdVendorSelect v-model="queryParams.vendorId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="入库日期" prop="receiptDate">
        <el-date-picker
          v-model="queryParams.receiptDate"
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
          v-hasPermi="['mes:wm-outsource-receipt:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-outsource-receipt:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="入库单编号" align="center" prop="code" min-width="160" />
      <el-table-column label="入库单名称" align="center" prop="name" min-width="150" />
      <el-table-column label="外协工单号" align="center" prop="workOrderCode" min-width="140" />
      <el-table-column label="供应商名称" align="center" prop="vendorName" min-width="120" />
      <el-table-column
        label="入库日期"
        align="center"
        prop="receiptDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_OUTSOURCE_RECEIPT_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、提交、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-outsource-receipt:update']"
            v-if="scope.row.status === MesWmOutsourceReceiptStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleSubmit(scope.row.id)"
            v-hasPermi="['mes:wm-outsource-receipt:update']"
            v-if="scope.row.status === MesWmOutsourceReceiptStatusEnum.PREPARE"
          >
            提交
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-outsource-receipt:delete']"
            v-if="scope.row.status === MesWmOutsourceReceiptStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- 待上架：执行上架 -->
          <el-button
            link
            type="success"
            @click="openForm('stock', scope.row.id)"
            v-hasPermi="['mes:wm-outsource-receipt:update']"
            v-if="scope.row.status === MesWmOutsourceReceiptStatusEnum.APPROVING"
          >
            执行上架
          </el-button>
          <!-- 已上架：执行退料 -->
          <el-button
            link
            type="primary"
            @click="handleFinish(scope.row.id)"
            v-hasPermi="['mes:wm-outsource-receipt:finish']"
            v-if="scope.row.status === MesWmOutsourceReceiptStatusEnum.APPROVED"
          >
            执行退料
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:wm-outsource-receipt:update']"
            v-if="
              [
                MesWmOutsourceReceiptStatusEnum.APPROVING,
                MesWmOutsourceReceiptStatusEnum.APPROVED
              ].includes(scope.row.status)
            "
          >
            取消
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

  <OutsourceReceiptForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import { WmOutsourceReceiptApi, WmOutsourceReceiptVO } from '@/api/mes/wm/outsourcereceipt'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import OutsourceReceiptForm from './OutsourceReceiptForm.vue'
import { MesWmOutsourceReceiptStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmOutsourceReceipt' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<WmOutsourceReceiptVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  vendorId: undefined,
  receiptDate: undefined
})
const queryFormRef = ref()
const formRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmOutsourceReceiptApi.getOutsourceReceiptPage(queryParams)
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

/** 提交按钮操作 */
const handleSubmit = async (id: number) => {
  try {
    await message.confirm('确认提交该外协入库单？')
    await WmOutsourceReceiptApi.submitOutsourceReceipt(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 审批 */
const handleApprove = async (id: number) => {
  try {
    await message.confirm('确认审批该外协入库单？')
    await WmOutsourceReceiptApi.approveOutsourceReceipt(id)
    message.success('审批成功')
    await getList()
  } catch {}
}

/** 完成 */
const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认完成该外协入库单？完成后将更新库存台账。')
    await WmOutsourceReceiptApi.finishOutsourceReceipt(id)
    message.success('完成成功')
    await getList()
  } catch {}
}

/** 取消 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该外协入库单？取消后不可恢复。')
    await WmOutsourceReceiptApi.cancelOutsourceReceipt(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmOutsourceReceiptApi.deleteOutsourceReceipt(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmOutsourceReceiptApi.exportOutsourceReceipt(queryParams)
    download.excel(data, '外协入库单.xls')
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
