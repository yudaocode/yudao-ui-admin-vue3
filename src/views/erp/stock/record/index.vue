<!-- ERP 产品库存明细列表 -->
<template>
  <doc-alert title="【库存】产品库存、库存明细" url="https://doc.iocoder.cn/erp/stock/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="产品" prop="productId">
        <el-select
          v-model="queryParams.productId"
          clearable
          filterable
          placeholder="请选择产品"
          class="!w-240px"
        >
          <el-option
            v-for="item in productList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="仓库" prop="warehouseId">
        <el-select
          v-model="queryParams.warehouseId"
          clearable
          filterable
          placeholder="请选择仓库"
          class="!w-240px"
        >
          <el-option
            v-for="item in warehouseList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="类型" prop="bizType">
        <el-select
          v-model="queryParams.bizType"
          placeholder="请选择类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.ERP_STOCK_RECORD_BIZ_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务单号" prop="bizNo">
        <el-input
          v-model="queryParams.bizNo"
          placeholder="请输入业务单号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
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
          v-hasPermi="['erp:stock-record:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['erp:stock-record:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="产品名称" align="center" prop="productName" />
      <el-table-column label="产品分类" align="center" prop="categoryName" />
      <el-table-column label="产品单位" align="center" prop="unitName" />
      <el-table-column label="仓库编号" align="center" prop="warehouseName" />
      <el-table-column label="类型" align="center" prop="bizType" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.ERP_STOCK_RECORD_BIZ_TYPE" :value="scope.row.bizType" />
        </template>
      </el-table-column>
      <el-table-column label="出入库单号" align="center" prop="bizNo" width="200" />
      <el-table-column
        label="出入库日期"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="出入库数量"
        align="center"
        prop="count"
        :formatter="erpCountTableColumnFormatter"
      />
      <el-table-column
        label="库存量"
        align="center"
        prop="totalCount"
        :formatter="erpCountTableColumnFormatter"
      />
      <el-table-column label="操作人" align="center" prop="creatorName" />
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { StockRecordApi, StockRecordVO } from '@/api/erp/stock/record'
import { ProductApi, ProductVO } from '@/api/erp/product/product'
import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'
import { erpCountTableColumnFormatter } from '@/utils'

/** ERP 产品库存明细列表 */
defineOptions({ name: 'ErpStockRecord' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<StockRecordVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  productId: undefined,
  warehouseId: undefined,
  bizType: undefined,
  bizNo: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
const productList = ref<ProductVO[]>([]) // 产品列表
const warehouseList = ref<WarehouseVO[]>([]) // 仓库列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await StockRecordApi.getStockRecordPage(queryParams)
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
    await StockRecordApi.deleteStockRecord(id)
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
    const data = await StockRecordApi.exportStockRecord(queryParams)
    download.excel(data, '产品库存明细.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onActivated(() => {
  getList()
})

onMounted(async () => {
  await getList()
  // 加载产品、仓库列表
  productList.value = await ProductApi.getProductSimpleList()
  warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
})
</script>
