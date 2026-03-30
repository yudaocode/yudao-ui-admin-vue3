<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="出库单编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入出库单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="出库单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入出库单名称"
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
      <el-form-item label="出库日期" prop="salesDate">
        <el-date-picker
          v-model="queryParams.salesDate"
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
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS)"
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
          v-hasPermi="['mes:wm-product-sales:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-product-sales:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="出库单编号" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="出库单名称" align="center" prop="name" min-width="150" />
      <el-table-column label="发货通知单号" align="center" prop="noticeCode" min-width="160" />
      <el-table-column label="销售订单编号" align="center" prop="salesOrderCode" min-width="160" />
      <el-table-column label="客户编码" align="center" prop="clientCode" min-width="120" />
      <el-table-column label="客户名称" align="center" prop="clientName" min-width="120" />
      <el-table-column label="收货人" align="center" prop="contactName" min-width="100" />
      <el-table-column label="联系方式" align="center" prop="contactTelephone" min-width="120" />
      <el-table-column label="收货地址" align="center" prop="contactAddress" min-width="180" />
      <el-table-column label="承运商" align="center" prop="carrier" min-width="120" />
      <el-table-column label="运输单号" align="center" prop="shippingNumber" min-width="160" />
      <el-table-column
        label="出库日期"
        align="center"
        prop="salesDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、提交、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-product-sales:update']"
            v-if="scope.row.status === MesWmProductSalesStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleSubmit(scope.row.id)"
            v-hasPermi="['mes:wm-product-sales:submit']"
            v-if="scope.row.status === MesWmProductSalesStatusEnum.PREPARE"
          >
            提交
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-product-sales:delete']"
            v-if="scope.row.status === MesWmProductSalesStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- 待拣货：拣货、取消 -->
          <el-button
            link
            type="success"
            @click="openForm('stock', scope.row.id)"
            v-hasPermi="['mes:wm-product-sales:stock']"
            v-if="scope.row.status === MesWmProductSalesStatusEnum.APPROVING"
          >
            拣货
          </el-button>
          <!-- 待填写运单：填写运单、取消 -->
          <el-button
            link
            type="warning"
            @click="openForm('shipping', scope.row.id)"
            v-hasPermi="['mes:wm-product-sales:shipping']"
            v-if="scope.row.status === MesWmProductSalesStatusEnum.SHIPPING"
          >
            填写运单
          </el-button>
          <!-- 待出库：执行出库、取消 -->
          <el-button
            link
            type="success"
            @click="openForm('finish', scope.row.id)"
            v-hasPermi="['mes:wm-product-sales:finish']"
            v-if="scope.row.status === MesWmProductSalesStatusEnum.APPROVED"
          >
            执行出库
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:wm-product-sales:cancel']"
            v-if="
              [
                MesWmProductSalesStatusEnum.CONFIRMED,
                MesWmProductSalesStatusEnum.APPROVING,
                MesWmProductSalesStatusEnum.SHIPPING,
                MesWmProductSalesStatusEnum.APPROVED
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

  <ProductSalesForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { WmProductSalesApi, WmProductSalesVO } from '@/api/mes/wm/productsales'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import ProductSalesForm from './ProductSalesForm.vue'
import { MesWmProductSalesStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmProductSales' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<WmProductSalesVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  salesOrderCode: undefined,
  clientId: undefined,
  salesDate: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmProductSalesApi.getProductSalesPage(queryParams)
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
    await message.confirm('确认提交该销售出库单？')
    await WmProductSalesApi.submitProductSales(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 取消按钮操作 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该销售出库单？取消后不可恢复。')
    await WmProductSalesApi.cancelProductSales(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmProductSalesApi.deleteProductSales(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmProductSalesApi.exportProductSales(queryParams)
    download.excel(data, '销售出库单.xls')
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
