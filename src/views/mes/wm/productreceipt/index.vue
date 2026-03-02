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
      <el-form-item label="生产工单" prop="workOrderId">
        <ProWorkOrderSelect v-model="queryParams.workOrderId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="产品物料" prop="itemId">
        <MdItemSelect v-model="queryParams.itemId" class="!w-240px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-product-receipt:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-product-receipt:export']"
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
      <el-table-column label="生产工单" align="center" prop="workOrderCode" min-width="140" />
      <el-table-column label="产品物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="计量单位" align="center" prop="unitMeasureName" min-width="100" />
      <el-table-column
        label="入库日期"
        align="center"
        prop="receiptDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="单据状态" align="center" prop="status" min-width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_PRODUCT_RECPT_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、提交、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-product-receipt:update']"
            v-if="scope.row.status === MesWmProductReceiptStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleSubmit(scope.row.id)"
            v-hasPermi="['mes:wm-product-receipt:update']"
            v-if="scope.row.status === MesWmProductReceiptStatusEnum.PREPARE"
          >
            提交
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-product-receipt:delete']"
            v-if="scope.row.status === MesWmProductReceiptStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- 待拣货：执行上架 -->
          <el-button
            link
            type="success"
            @click="openForm('stock', scope.row.id)"
            v-hasPermi="['mes:wm-product-receipt:update']"
            v-if="scope.row.status === MesWmProductReceiptStatusEnum.APPROVING"
          >
            执行上架
          </el-button>
          <!-- 待执行入库：执行入库 -->
          <el-button
            link
            type="primary"
            @click="handleFinish(scope.row.id)"
            v-hasPermi="['mes:wm-product-receipt:finish']"
            v-if="scope.row.status === MesWmProductReceiptStatusEnum.APPROVED"
          >
            执行入库
          </el-button>
          <!-- 待拣货、待执行入库：取消 -->
          <el-button
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:wm-product-receipt:update']"
            v-if="
              [
                MesWmProductReceiptStatusEnum.APPROVING,
                MesWmProductReceiptStatusEnum.APPROVED
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

  <ProductReceiptForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import { WmProductReceiptApi, WmProductReceiptVO } from '@/api/mes/wm/productreceipt'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import ProductReceiptForm from './ProductReceiptForm.vue'
import { MesWmProductReceiptStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmProductReceipt' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<WmProductReceiptVO[]>([])
const total = ref(0)
const exportLoading = ref(false)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  workOrderId: undefined,
  itemId: undefined
})
const queryFormRef = ref()
const formRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmProductReceiptApi.getProductReceiptPage(queryParams)
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
    await message.confirm('确认提交该产品入库单？')
    await WmProductReceiptApi.submitProductReceipt(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 执行入库 */
const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认执行入库？执行后将更新库存台账。')
    await WmProductReceiptApi.finishProductReceipt(id)
    message.success('入库成功')
    await getList()
  } catch {}
}

/** 取消 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该产品入库单？取消后不可恢复。')
    await WmProductReceiptApi.cancelProductReceipt(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmProductReceiptApi.deleteProductReceipt(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmProductReceiptApi.exportProductReceipt(queryParams)
    download.excel(data, '产品入库单.xls')
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
