<template>
  <ContentWrap>
    <el-alert
      v-if="currentLocationId"
      :title="`当前仓库/库区：${currentWarehouseName || `#${currentWarehouseId || '-'}`} / ${currentLocationName || `#${currentLocationId}`}`"
      type="info"
      show-icon
      :closable="false"
      class="!mb-12px"
    />
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <!-- TODO @AI：只保留：库位编码、名称，其它状态、冻结都删除； -->
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
      <!-- TODO @AI：额外增加：库位位置 X、库位位置 Y、库位位置 Z -->
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button @click="goBackToLocation"
          ><Icon icon="ep:back" class="mr-5px" /> 返回库区</el-button
        >
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-warehouse:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-warehouse:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="库位编码" align="center" prop="code" min-width="120" />
      <el-table-column label="库位名称" align="center" prop="name" min-width="140" />
      <el-table-column label="面积（㎡）" align="center" prop="area" min-width="90" />
      <el-table-column label="最大载重" align="center" prop="maxLoad" min-width="100" />
      <!-- TODO @AI：库位位置 X、Y、Z -->
      <!-- TODO @AI：使用字典渲染； -->
      <el-table-column label="启用" align="center" prop="enabled" min-width="70">
        <template #default="scope">
          <el-tag :type="scope.row.enabled ? 'success' : 'info'">{{
            scope.row.enabled ? '是' : '否'
          }}</el-tag>
        </template>
      </el-table-column>
      <!-- TODO @AI：删除状态字段，前端+后端、数据库 -->
      <el-table-column label="状态" align="center" prop="status" min-width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="冻结" align="center" prop="frozen" min-width="80">
        <template #default="scope">
          <el-tag :type="scope.row.frozen ? 'danger' : 'success'">{{
            scope.row.frozen ? '是' : '否'
          }}</el-tag>
        </template>
      </el-table-column>
      <!-- TODO @AI：增加备注； -->
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
            v-hasPermi="['mes:wm-warehouse:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-warehouse:delete']"
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
import { WmWarehouseLocationApi } from '@/api/mes/wm/warehouse/location'
import { WmWarehouseAreaApi, WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import AreaForm from './AreaForm.vue'

defineOptions({ name: 'MesWmArea' })

const message = useMessage()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const loading = ref(true)
const list = ref<WmWarehouseAreaVO[]>([])
const total = ref(0)
const currentWarehouseId = ref<number | undefined>(undefined)
const currentWarehouseName = ref('')
const currentLocationId = ref<number | undefined>(undefined)
const currentLocationName = ref('')
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

const parseQueryId = (queryValue: string | string[] | null | undefined): number | undefined => {
  const value = Array.isArray(queryValue) ? queryValue[0] : queryValue
  if (!value) {
    return undefined
  }
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

const loadLocationContext = async () => {
  const locationId = parseQueryId(route.query.locationId as string | string[] | undefined)
  if (!locationId) {
    return
  }
  currentLocationId.value = locationId
  queryParams.locationId = locationId
  try {
    const location = await WmWarehouseLocationApi.getWarehouseLocation(locationId)
    currentLocationName.value = location.name
    currentWarehouseId.value = location.warehouseId
    currentWarehouseName.value = location.warehouseName
  } catch {
    // 忽略上级名称加载异常，不影响列表查询
  }
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
  queryFormRef.value.resetFields()
  queryParams.locationId = currentLocationId.value
  handleQuery()
}

/** 返回库区页面 */
const goBackToLocation = () => {
  if (currentWarehouseId.value) {
    router.push({
      path: '/mes/wm/warehouse/location',
      query: { warehouseId: String(currentWarehouseId.value) }
    })
    return
  }
  router.push('/mes/wm/warehouse/location')
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, currentLocationId.value, currentWarehouseId.value)
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
  await loadLocationContext()
  await getList()
})
</script>
