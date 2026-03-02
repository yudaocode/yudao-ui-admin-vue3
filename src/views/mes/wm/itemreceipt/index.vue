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
          v-hasPermi="['mes:wm-item-receipt:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-item-receipt:export']"
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
          <dict-tag :type="DICT_TYPE.MES_WM_ITEM_RECEIPT_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、提交、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-item-receipt:update']"
            v-if="scope.row.status === MesWmItemReceiptStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleSubmit(scope.row.id)"
            v-hasPermi="['mes:wm-item-receipt:update']"
            v-if="scope.row.status === MesWmItemReceiptStatusEnum.PREPARE"
          >
            提交
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-item-receipt:delete']"
            v-if="scope.row.status === MesWmItemReceiptStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- 待上架：执行上架、取消 -->
          <el-button
            link
            type="success"
            @click="openForm('stock', scope.row.id)"
            v-hasPermi="['mes:wm-item-receipt:update']"
            v-if="scope.row.status === MesWmItemReceiptStatusEnum.APPROVING"
          >
            执行上架
          </el-button>
          <!-- 待入库：执行入库、取消 -->
          <el-button
            link
            type="primary"
            @click="handleFinish(scope.row.id)"
            v-hasPermi="['mes:wm-item-receipt:finish']"
            v-if="scope.row.status === MesWmItemReceiptStatusEnum.APPROVED"
          >
            执行入库
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:wm-item-receipt:update']"
            v-if="
              [MesWmItemReceiptStatusEnum.APPROVING, MesWmItemReceiptStatusEnum.APPROVED].includes(
                scope.row.status
              )
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

  <ItemReceiptForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import { WmItemReceiptApi, WmItemReceiptVO } from '@/api/mes/wm/itemreceipt'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import ItemReceiptForm from './ItemReceiptForm.vue'
import { MesWmItemReceiptStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmItemReceipt' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<WmItemReceiptVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  vendorId: undefined,
  receiptDate: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmItemReceiptApi.getItemReceiptPage(queryParams)
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
    await message.confirm('确认提交该采购入库单？')
    await WmItemReceiptApi.submitItemReceipt(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 执行入库 */
const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认执行入库？执行后将更新库存台账。')
    await WmItemReceiptApi.finishItemReceipt(id)
    message.success('入库成功')
    await getList()
  } catch {}
}

/** 取消 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该采购入库单？取消后不可恢复。')
    await WmItemReceiptApi.cancelItemReceipt(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmItemReceiptApi.deleteItemReceipt(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmItemReceiptApi.exportItemReceipt(queryParams)
    download.excel(data, '采购入库单.xls')
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
