<!-- MES 库存台账列表 -->
<template>
  <el-row :gutter="20">
    <!-- 左侧分类树 -->
    <el-col :span="4" :xs="24">
      <ContentWrap class="h-1/1">
        <ItemTypeTree @node-click="handleTypeNodeClick" />
      </ContentWrap>
    </el-col>
    <el-col :span="20" :xs="24">
      <ContentWrap>
        <!-- 搜索工作栏 -->
        <el-form
          class="-mb-15px"
          :model="queryParams"
          ref="queryFormRef"
          :inline="true"
          label-width="68px"
        >
          <el-form-item label="物料编码" prop="itemCode">
            <el-input
              v-model="queryParams.itemCode"
              placeholder="请输入物料编码"
              clearable
              @keyup.enter="handleQuery"
              class="!w-200px"
            />
          </el-form-item>
          <el-form-item label="物料名称" prop="itemName">
            <el-input
              v-model="queryParams.itemName"
              placeholder="请输入物料名称"
              clearable
              @keyup.enter="handleQuery"
              class="!w-200px"
            />
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId">
            <el-select
              v-model="queryParams.warehouseId"
              placeholder="请选择仓库"
              clearable
              class="!w-200px"
              @change="handleWarehouseChange"
            >
              <el-option
                v-for="item in warehouseList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="库区" prop="locationId">
            <el-select
              v-model="queryParams.locationId"
              placeholder="请选择库区"
              clearable
              class="!w-200px"
            >
              <el-option
                v-for="item in locationList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="是否冻结" prop="frozen">
            <el-select
              v-model="queryParams.frozen"
              placeholder="请选择"
              clearable
              class="!w-200px"
            >
              <el-option :value="true" label="是" />
              <el-option :value="false" label="否" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery">
              <Icon icon="ep:search" class="mr-5px" /> 搜索
            </el-button>
            <el-button @click="resetQuery">
              <Icon icon="ep:refresh" class="mr-5px" /> 重置
            </el-button>
            <el-button
              type="success"
              plain
              @click="handleExport"
              :loading="exportLoading"
              v-hasPermi="['mes:wm-material-stock:export']"
            >
              <Icon icon="ep:download" class="mr-5px" /> 导出
            </el-button>
          </el-form-item>
        </el-form>
      </ContentWrap>

      <!-- 列表 -->
      <ContentWrap>
        <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
          <el-table-column label="产品物料编码" align="center" prop="itemCode" min-width="120" />
          <el-table-column label="产品物料名称" align="center" prop="itemName" min-width="140" />
          <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
          <el-table-column label="在库数量" align="center" prop="quantityOnhand" min-width="100" />
          <el-table-column label="单位" align="center" prop="unitMeasureName" min-width="80" />
          <!-- TODO @芋艿：批次号； -->
          <el-table-column label="仓库" align="center" prop="warehouseName" min-width="100" />
          <el-table-column label="库区" align="center" prop="locationName" min-width="100" />
          <el-table-column label="库位" align="center" prop="areaName" min-width="100">
            <template #default="scope">
              <el-button
                v-if="scope.row.areaId"
                link
                type="primary"
                @click="openAreaDetail(scope.row.areaId)"
              >
                {{ scope.row.areaName }}
              </el-button>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="生产工单" align="center" prop="workOrderCode" min-width="120" />
          <el-table-column
            label="入库日期"
            align="center"
            prop="recptDate"
            :formatter="dateFormatter"
            width="180px"
          />
          <el-table-column label="冻结" align="center" prop="frozen" min-width="80">
            <template #default="scope">
              <el-switch
                v-model="scope.row.frozen"
                :active-value="true"
                :inactive-value="false"
                v-hasPermi="['mes:wm-material-stock:update']"
                @change="handleFrozenChange(scope.row)"
              />
            </template>
          </el-table-column>
        </el-table>
        <!-- 分页 -->
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </ContentWrap>
    </el-col>
  </el-row>

  <!-- 库位详情弹窗 -->
  <AreaForm ref="areaFormRef" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { WmMaterialStockApi, WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import { WmWarehouseApi } from '@/api/mes/wm/warehouse'
import { WmWarehouseLocationApi } from '@/api/mes/wm/warehouse/location'
import ItemTypeTree from '@/views/mes/md/item/ItemTypeTree.vue'
import AreaForm from '@/views/mes/wm/warehouse/area/AreaForm.vue'

defineOptions({ name: 'MesWmMaterialStock' })

const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const list = ref<WmMaterialStockVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  itemTypeId: undefined,
  itemCode: undefined,
  itemName: undefined,
  warehouseId: undefined,
  locationId: undefined,
  frozen: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

// 仓库、库区下拉数据
const warehouseList = ref<any[]>([])
const locationList = ref<any[]>([])

/** 加载仓库列表 */
const loadWarehouseList = async () => {
  warehouseList.value = await WmWarehouseApi.getWarehouseSimpleList()
}

/** 仓库切换时联动加载库区 */
const handleWarehouseChange = async (warehouseId: number | undefined) => {
  queryParams.locationId = undefined
  if (warehouseId) {
    locationList.value = await WmWarehouseLocationApi.getWarehouseLocationSimpleList(warehouseId)
  } else {
    locationList.value = []
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmMaterialStockApi.getMaterialStockPage(queryParams)
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
  queryParams.itemTypeId = undefined
  locationList.value = []
  handleQuery()
}

/** 处理分类树节点点击 */
const handleTypeNodeClick = (row: any) => {
  queryParams.itemTypeId = row?.id
  handleQuery()
}

/** 处理冻结状态切换 */
const handleFrozenChange = async (row: WmMaterialStockVO) => {
  try {
    await WmMaterialStockApi.updateMaterialStockFrozen({ id: row.id, frozen: row.frozen })
    message.success(row.frozen ? '冻结成功' : '解冻成功')
  } catch {
    // 失败时回滚
    row.frozen = !row.frozen
  }
}

/** 打开库位详情弹窗 */
const areaFormRef = ref()
const openAreaDetail = (areaId: number) => {
  areaFormRef.value.open('detail', areaId)
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmMaterialStockApi.exportMaterialStock(queryParams)
    download.excel(data, '库存台账.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await Promise.all([loadWarehouseList(), getList()])
})
</script>
