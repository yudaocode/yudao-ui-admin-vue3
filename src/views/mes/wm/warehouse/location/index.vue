<template>
  <ContentWrap>
    <el-alert
      v-if="currentWarehouseId"
      :title="`当前仓库：${currentWarehouseName || `#${currentWarehouseId}`}`"
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
      <!-- TODO @AI：只保留：区域编码、名称，其它状态、冻结都删除； -->
      <el-form-item label="库区编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入库区编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="库区名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入库区名称"
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
        <el-button @click="goBackToWarehouse"
          ><Icon icon="ep:back" class="mr-5px" /> 返回仓库</el-button
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
      <el-table-column label="库区编码" align="center" prop="code" min-width="120" />
      <el-table-column label="库区名称" align="center" prop="name" min-width="140" />
      <el-table-column label="面积（㎡）" align="center" prop="area" min-width="100" />
      <!-- TODO @AI：去掉库位管理、状态字段； -->
      <el-table-column label="库位管理" align="center" prop="areaEnabled" min-width="90">
        <template #default="scope">
          <el-tag :type="scope.row.areaEnabled ? 'success' : 'info'">{{
            scope.row.areaEnabled ? '启用' : '关闭'
          }}</el-tag>
        </template>
      </el-table-column>
      <!-- TODO @AI：删除状态字段，前端+后端、数据库 -->
      <el-table-column label="状态" align="center" prop="status" min-width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <!-- TODO @AI：使用字典渲染； -->
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
      <el-table-column label="操作" align="center" width="220">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openArea(scope.row.id)"
            v-hasPermi="['mes:wm-warehouse:query']"
          >
            库位
          </el-button>
          <!-- TODO @芋艿：标签打印 -->
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

  <LocationForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { WmWarehouseApi } from '@/api/mes/wm/warehouse'
import { WmWarehouseLocationApi, WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import LocationForm from './LocationForm.vue'

defineOptions({ name: 'MesWmLocation' })

const message = useMessage()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const loading = ref(true)
const list = ref<WmWarehouseLocationVO[]>([])
const total = ref(0)
const currentWarehouseId = ref<number | undefined>(undefined)
// TODO @AI：搞个 currentWarehouse 对象；
const currentWarehouseName = ref('')
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  warehouseId: undefined,
  status: undefined,
  frozen: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

// TODO @AI：只考虑解析成 number，不要搞这么复杂；必须存在！
const parseQueryId = (queryValue: string | string[] | null | undefined): number | undefined => {
  const value = Array.isArray(queryValue) ? queryValue[0] : queryValue
  if (!value) {
    return undefined
  }
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

// TODO @AI：这个逻辑简化下，别搞这么复杂；
const loadWarehouseContext = async () => {
  const warehouseId = parseQueryId(route.query.warehouseId as string | string[] | undefined)
  if (!warehouseId) {
    return
  }
  currentWarehouseId.value = warehouseId
  queryParams.warehouseId = warehouseId
  try {
    const warehouse = await WmWarehouseApi.getWarehouse(warehouseId)
    currentWarehouseName.value = warehouse.name
  } catch {
    // 忽略上级名称加载异常，不影响列表查询
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmWarehouseLocationApi.getWarehouseLocationPage(queryParams)
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
  queryParams.warehouseId = currentWarehouseId.value
  handleQuery()
}

/** 返回仓库页面 */
const goBackToWarehouse = () => {
  router.push('/mes/wm/warehouse')
}

/** 打开库位页面 */
const openArea = (locationId: number) => {
  router.push({
    path: '/mes/wm/warehouse/area',
    query: { locationId: String(locationId) }
  })
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, currentWarehouseId.value)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmWarehouseLocationApi.deleteWarehouseLocation(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmWarehouseLocationApi.exportWarehouseLocation(queryParams)
    download.excel(data, '库区.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

onMounted(async () => {
  await loadWarehouseContext()
  await getList()
})
</script>
