<!-- MES 采购入库明细列表子组件（上架分配） -->
<!-- TODO DONE @AI：暂不融合。当前通过行弹窗嵌套展示明细，结构清晰。后续可考虑改为 el-table expand-row 折叠行方式 -->
<template>
  <div>
    <!-- TODO @AI：不用这个交互，还是使用所在行的【上架】操作； -->
    <el-button v-if="!isReadonly" type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加上架明细
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <!-- TODO @AI：折叠方案【必须按照我说的】：如果有 MesWmItemReceiptDetailDO，则可以展开展示；只在存在类似数据的时候，才有这个交互；
        字段有：仓库名称、库区名称、库位名称、上架数量；如果没有数据，则不展示这个交互；【允许编辑、删除】；当然，还是要注意下 formType；
       -->
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="上架数量" align="center" prop="quantity" width="100" />
      <el-table-column label="仓库" align="center" prop="warehouseName" min-width="100" />
      <el-table-column label="库区" align="center" prop="locationName" min-width="100" />
      <el-table-column label="库位" align="center" prop="areaName" min-width="100" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column v-if="!isReadonly" label="操作" align="center" width="120" fixed="right">
        <template #default="scope">
          <!-- TODO DONE @AI：已通过 isReadonly 计算属性控制。shelving 模式下可编辑，detail 模式只读 -->
          <el-button link type="primary" @click="openForm('update', scope.row.id)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
          <!-- TODO @AI：你没理解我的意思，我指的是：formType 为“上架”时，需要有 【上架】按钮。然后弹出 MesWmItemReceiptDetailDO 的添加！！！

            里面的字段是：【物资材料选择】【入库仓库】【数量】；
           -->
          <!-- TODO @芋艿【暂时不用删除】：标签打印； -->
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
  <!-- TODO DONE @AI：当前方案为弹窗嵌套展示，暂不改为折叠行 -->
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
            <WmWarehouseSelect v-model="formData.warehouseId" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库区" prop="locationId">
            <WmWarehouseLocationSelect
              v-model="formData.locationId"
              :warehouse-id="formData.warehouseId"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库位" prop="areaId">
            <WmWarehouseAreaSelect v-model="formData.areaId" :location-id="formData.locationId" />
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
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'

defineOptions({ name: 'ItemReceiptDetailList' })

const props = defineProps<{
  receiptId: number
  lineId: number
  formType: string
}>()

/** 明细在 detail 模式下只读，shelving 模式下可编辑 */
const isReadonly = computed(() => props.formType === 'detail')

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
const detailFormType = ref('') // 明细表单的类型
const itemList = ref<any[]>([]) // 物料列表
const formData = ref({
  id: undefined,
  lineId: undefined as number | undefined,
  receiptId: undefined as number | undefined,
  itemId: undefined,
  quantity: undefined,
  warehouseId: undefined as number | undefined,
  locationId: undefined as number | undefined,
  areaId: undefined as number | undefined,
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
  detailFormType.value = type
  resetForm()
  // 加载物料列表
  itemList.value = await MdItemApi.getItemSimpleList()
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
    if (detailFormType.value === 'create') {
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
