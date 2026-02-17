<template>
  <ContentWrap>
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <el-form-item label="所属仓库">
        <el-select
          v-model="queryWarehouseId"
          placeholder="请选择仓库"
          clearable
          class="!w-240px"
          @change="handleWarehouseChange"
        >
          <el-option
            v-for="warehouse in warehouseList"
            :key="warehouse.id"
            :label="warehouse.name"
            :value="warehouse.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="所属库区" prop="locationId">
        <el-select v-model="queryParams.locationId" placeholder="请选择库区" clearable class="!w-240px" :disabled="!queryWarehouseId">
          <el-option
            v-for="location in locationList"
            :key="location.id"
            :label="location.name"
            :value="location.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="库位编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入库位编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="库位名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入库位名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="冻结" prop="frozen">
        <el-select v-model="queryParams.frozen" placeholder="请选择" clearable class="!w-240px">
          <el-option :value="true" label="是" />
          <el-option :value="false" label="否" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['mes:wm-warehouse-area:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-warehouse-area:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="所属仓库" align="center" prop="warehouseName" min-width="130" />
      <el-table-column label="所属库区" align="center" prop="locationName" min-width="130" />
      <el-table-column label="库位编码" align="center" prop="code" min-width="120" />
      <el-table-column label="库位名称" align="center" prop="name" min-width="140" />
      <el-table-column label="面积" align="center" prop="area" min-width="90" />
      <el-table-column label="最大载重" align="center" prop="maxLoad" min-width="100" />
      <el-table-column label="启用" align="center" prop="enabled" min-width="70">
        <template #default="scope">
          <el-tag :type="scope.row.enabled ? 'success' : 'info'">{{ scope.row.enabled ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" min-width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="冻结" align="center" prop="frozen" min-width="80">
        <template #default="scope">
          <el-tag :type="scope.row.frozen ? 'danger' : 'success'">{{ scope.row.frozen ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="150">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-warehouse-area:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-warehouse-area:delete']"
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

  <AreaForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { WmWarehouseApi, WmWarehouseVO } from '@/api/mes/wm/warehouse'
import { WmWarehouseLocationApi, WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import { WmWarehouseAreaApi, WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import AreaForm from './AreaForm.vue'

defineOptions({ name: 'MesWmArea' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<WmWarehouseAreaVO[]>([])
const total = ref(0)
const warehouseList = ref<WmWarehouseVO[]>([])
const locationList = ref<WmWarehouseLocationVO[]>([])
const queryWarehouseId = ref<number | undefined>(undefined)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  locationId: undefined,
  status: undefined,
  frozen: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

const loadLocationList = async (warehouseId?: number) => {
  if (!warehouseId) {
    locationList.value = []
    return
  }
  locationList.value = await WmWarehouseLocationApi.getWarehouseLocationSimpleList(warehouseId)
}

const handleWarehouseChange = async (warehouseId?: number) => {
  queryParams.locationId = undefined
  await loadLocationList(warehouseId)
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmWarehouseAreaApi.getWarehouseAreaPage(queryParams)
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
  queryWarehouseId.value = undefined
  locationList.value = []
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
    await message.delConfirm()
    await WmWarehouseAreaApi.deleteWarehouseArea(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmWarehouseAreaApi.exportWarehouseArea(queryParams)
    download.excel(data, '库位.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

onMounted(async () => {
  await getList()
  warehouseList.value = await WmWarehouseApi.getWarehouseSimpleList()
})
</script>
