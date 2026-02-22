<!-- MES 采购入库明细列表子组件（上架分配） -->
<!-- TODO @AI：待 review -->
<template>
  <div>
    <el-button type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加上架明细
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="上架数量" align="center" prop="quantity" width="100" />
      <el-table-column label="仓库" align="center" prop="warehouseName" min-width="100" />
      <el-table-column label="库区" align="center" prop="locationName" min-width="100" />
      <el-table-column label="库位" align="center" prop="areaName" min-width="100" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>

  <!-- 添加/编辑上架明细弹窗 -->
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="700px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="物料" prop="itemId">
            <el-select
              v-model="formData.itemId"
              placeholder="请选择物料"
              filterable
              clearable
              class="!w-1/1"
            >
              <el-option
                v-for="item in itemList"
                :key="item.id"
                :label="`${item.code} - ${item.name}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上架数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <el-select
              v-model="formData.warehouseId"
              placeholder="请选择仓库"
              clearable
              class="!w-1/1"
            >
              <el-option
                v-for="warehouse in warehouseList"
                :key="warehouse.id"
                :label="warehouse.name"
                :value="warehouse.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <!-- TODO @芋艿：后续需要通过仓库联动查询库区 -->
          <el-form-item label="库区" prop="locationId">
            <el-input v-model="formData.locationId" placeholder="请输入库区ID" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <!-- TODO @芋艿：后续需要通过库区联动查询库位 -->
          <el-form-item label="库位" prop="areaId">
            <el-input v-model="formData.areaId" placeholder="请输入库位ID" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmItemReceiptDetailApi, WmItemReceiptDetailVO } from '@/api/mes/wm/itemreceipt/detail'
import { MdItemApi } from '@/api/mes/md/item'
import { WmWarehouseApi } from '@/api/mes/wm/warehouse'

defineOptions({ name: 'ItemReceiptDetailList' })

const props = defineProps<{
  receiptId: number
  lineId: number
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

// ==================== 列表 ====================
const loading = ref(false) // 列表的加载中
const list = ref<WmItemReceiptDetailVO[]>([]) // 明细列表
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  receiptId: undefined as number | undefined,
  lineId: undefined as number | undefined
})

/** 查询明细列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.receiptId = props.receiptId
    queryParams.lineId = props.lineId
    const data = await WmItemReceiptDetailApi.getItemReceiptDetailPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmItemReceiptDetailApi.deleteItemReceiptDetail(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型
const itemList = ref<any[]>([]) // 物料列表
const warehouseList = ref<any[]>([]) // 仓库列表
const formData = ref({
  id: undefined,
  lineId: undefined as number | undefined,
  receiptId: undefined as number | undefined,
  itemId: undefined,
  quantity: undefined,
  warehouseId: undefined,
  locationId: undefined,
  areaId: undefined,
  batchId: undefined,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '上架数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 加载物料和仓库列表
  const [items, warehouses] = await Promise.all([
    MdItemApi.getItemSimpleList(),
    WmWarehouseApi.getWarehouseSimpleList()
  ])
  itemList.value = items
  warehouseList.value = warehouses
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmItemReceiptDetailApi.getItemReceiptDetail(id)
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      receiptId: props.receiptId,
      lineId: props.lineId
    } as unknown as WmItemReceiptDetailVO
    if (formType.value === 'create') {
      await WmItemReceiptDetailApi.createItemReceiptDetail(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmItemReceiptDetailApi.updateItemReceiptDetail(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    lineId: undefined,
    receiptId: undefined,
    itemId: undefined,
    quantity: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    batchId: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
