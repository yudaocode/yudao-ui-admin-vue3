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
      <el-form-item label="杂项类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择杂项类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_MISC_RECEIPT_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="来源单据编号" prop="sourceDocCode">
        <el-input
          v-model="queryParams.sourceDocCode"
          placeholder="请输入来源单据编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="来源单据类型" prop="sourceDocType">
        <el-input
          v-model="queryParams.sourceDocType"
          placeholder="请输入来源单据类型"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
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
      <el-form-item label="单据状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择单据状态"
          clearable
          class="!w-240px"
        >
          <!-- DONE @AI：状态需要放到数据库中；目前没弄；然后，MES_WM_MISC_RECEIPT_STATUS 也没生命到变量里； -->
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_MISC_RECEIPT_STATUS)"
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
          v-hasPermi="['mes:wm:misc-receipt:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm:misc-receipt:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="入库单编号" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="入库单名称" align="center" prop="name" min-width="150" />
      <el-table-column label="杂项类型" align="center" prop="type" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_MISC_RECEIPT_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="来源单据编号" align="center" prop="sourceDocCode" min-width="150" />
      <el-table-column label="来源单据类型" align="center" prop="sourceDocType" min-width="120" />
      <el-table-column
        label="入库日期"
        align="center"
        prop="receiptDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_MISC_RECEIPT_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm:misc-receipt:update']"
            v-if="scope.row.status === MesWmMiscReceiptStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm:misc-receipt:delete']"
            v-if="scope.row.status === MesWmMiscReceiptStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- 已审批：执行入库、取消 -->
          <el-button
            link
            type="success"
            @click="openForm('finish', scope.row.id)"
            v-hasPermi="['mes:wm:misc-receipt:finish']"
            v-if="scope.row.status === MesWmMiscReceiptStatusEnum.APPROVED"
          >
            执行入库
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:wm:misc-receipt:cancel']"
            v-if="scope.row.status === MesWmMiscReceiptStatusEnum.APPROVED"
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

  <MiscReceiptForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { WmMiscReceiptApi, WmMiscReceiptVO } from '@/api/mes/wm/miscreceipt'
import MiscReceiptForm from './MiscReceiptForm.vue'
import { MesWmMiscReceiptStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmMiscReceipt' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<WmMiscReceiptVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  type: undefined,
  sourceDocCode: undefined,
  sourceDocType: undefined,
  status: undefined,
  receiptDate: undefined
})
const queryFormRef = ref()
const formRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmMiscReceiptApi.getMiscReceiptPage(queryParams)
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

/** 取消按钮操作 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该杂项入库单吗？')
    await WmMiscReceiptApi.cancelMiscReceipt(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmMiscReceiptApi.deleteMiscReceipt(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmMiscReceiptApi.exportMiscReceipt(queryParams)
    download.excel(data, '杂项入库单.xls')
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
