<template>
  <ContentWrap>
    <el-alert
      v-if="currentWarehouse?.id"
      :title="`当前仓库：${currentWarehouse.name || `#${currentWarehouse.id}`}`"
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
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:wm-warehouse:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="库区编码" align="center" prop="code" min-width="120">
        <template #default="scope">
          <el-link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="库区名称" align="center" prop="name" min-width="140" />
      <el-table-column label="面积（㎡）" align="center" prop="area" min-width="100" />
      <el-table-column label="冻结" align="center" prop="frozen" min-width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.frozen" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="180" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="260">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openArea(scope.row.id)"
            v-hasPermi="['mes:wm-warehouse:query']"
          >
            库位
          </el-button>
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
          <el-button
            link
            type="primary"
            @click="handleBarcode(scope.row)"
            v-hasPermi="['mes:wm-warehouse:query']"
          >
            条码
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
  <!-- 条码详情弹窗 -->
  <BarcodeDetail ref="barcodeDetailRef" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { WmWarehouseApi } from '@/api/mes/wm/warehouse'
import { WmWarehouseLocationApi, WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import LocationForm from './LocationForm.vue'
import { BarcodeDetail } from '@/views/mes/wm/barcode/components'
import { BarcodeBizTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmLocation' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const router = useRouter()
const route = useRoute()

const loading = ref(true) // 列表的加载中
const list = ref<WmWarehouseLocationVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const currentWarehouse = ref<{ id: number; name: string }>({
  id: 0,
  name: ''
}) // 当前仓库上下文
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  warehouseId: undefined as number | undefined
}) // 查询参数
const queryFormRef = ref() // 查询表单 Ref

/** 加载仓库上下文（从 URL query 参数获取 warehouseId，并加载仓库名称） */
const loadWarehouseContext = async () => {
  const warehouseId = Number(route.query.warehouseId)
  if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
    return
  }
  currentWarehouse.value.id = warehouseId
  queryParams.warehouseId = warehouseId
  try {
    const warehouse = await WmWarehouseApi.getWarehouse(warehouseId)
    currentWarehouse.value.name = warehouse.name || ''
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
  queryParams.warehouseId = currentWarehouse.value.id || undefined
  handleQuery()
}

/** 打开库位页面 */
const openArea = (locationId: number) => {
  router.push({
    name: 'MesWmArea',
    query: { locationId: String(locationId) }
  })
}

/** 添加/修改操作 */
const formRef = ref() // 表单 Ref
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, currentWarehouse.value.id || undefined)
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

/** 查看库区条码 */
const barcodeDetailRef = ref()
const handleBarcode = async (row: WmWarehouseLocationVO) => {
  await barcodeDetailRef.value.openByBusiness(
    row.id,
    BarcodeBizTypeEnum.LOCATION,
    row.code,
    row.name
  )
}

/** 初始化 */
onMounted(async () => {
  await loadWarehouseContext()
  await getList()
})
</script>
