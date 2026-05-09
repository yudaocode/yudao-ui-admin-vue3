<!-- WMS 库区管理 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="所属仓库" prop="warehouseId">
        <el-select
          v-model="queryParams.warehouseId"
          class="!w-240px"
          placeholder="请选择所属仓库"
          @change="warehouseChange"
        >
          <el-option
            v-for="warehouse in selectableWarehouseList"
            :key="warehouse.id"
            :label="warehouse.name"
            :value="warehouse.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="库区名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入库区名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="库区编号" prop="code">
        <el-input
          v-model="queryParams.code"
          class="!w-240px"
          clearable
          placeholder="请输入库区编号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
        <el-button
          v-hasPermi="['wms:warehouse-area:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" label="库区名称" prop="name" />
      <el-table-column align="center" label="库区编号" prop="code" />
      <el-table-column align="center" label="所属仓库" prop="warehouseName">
        <template #default="scope">
          {{ scope.row.warehouseName || getWarehouseName(scope.row.warehouseId) }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="备注" prop="remark" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="180"
      />
      <el-table-column align="center" label="操作" width="150">
        <template #default="scope">
          <el-button
            v-hasPermi="['wms:warehouse-area:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            修改
          </el-button>
          <el-button
            v-hasPermi="['wms:warehouse-area:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <WarehouseAreaForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { WarehouseApi, WarehouseVO } from '@/api/wms/warehouse'
import { WarehouseAreaApi, WarehouseAreaVO } from '@/api/wms/warehouse/area'
import WarehouseAreaForm from './WarehouseAreaForm.vue'

/** WMS 库区管理 */
defineOptions({ name: 'WmsWarehouseArea' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const route = useRoute() // 路由

const loading = ref(true) // 列表的加载中
const list = ref<WarehouseAreaVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  warehouseId: Number(route.params.warehouseId) || undefined,
  code: undefined,
  name: undefined
})
const queryFormRef = ref() // 搜索的表单
const warehouseList = ref<WarehouseVO[]>([]) // 仓库精简列表
const selectableWarehouseList = computed(() =>
  warehouseList.value.filter((warehouse): warehouse is WarehouseVO & { id: number } => !!warehouse.id)
)

/** 查询库区列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WarehouseAreaApi.getWarehouseAreaPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询仓库精简列表 */
const getWarehouseList = async () => {
  warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
}

/** 获得仓库名称 */
const getWarehouseName = (warehouseId?: number) => {
  return warehouseList.value.find((warehouse) => warehouse.id === warehouseId)?.name
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 所属仓库更改同时更新列表数据 */
const warehouseChange = () => {
  handleQuery()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, queryParams.warehouseId)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await WarehouseAreaApi.deleteWarehouseArea(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(async () => {
  await getWarehouseList()
  await getList()
})
</script>
