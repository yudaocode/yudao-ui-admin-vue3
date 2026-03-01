<!-- MES 产品入库单行列表子组件 -->
<template>
  <div>
    <el-button v-if="isUpdate" type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加物料
    </el-button>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      border
      :row-key="(row: any) => row.id"
    >
      <el-table-column type="expand">
        <template #default="scope">
          <ProductRecptDetailList
            :ref="(el: any) => setDetailListRef(scope.row.id, el)"
            :recpt-id="props.recptId"
            :line-id="scope.row.id"
            :item-id="scope.row.itemId"
            :form-type="props.formType"
            @edit-detail="
              (detailId: number) =>
                openDetailForm('update', scope.row.id, scope.row.itemId, detailId)
            "
          />
        </template>
      </el-table-column>
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="入库数量" align="center" prop="quantity" width="100" />
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column
        v-if="isUpdate || isStock"
        label="操作"
        align="center"
        width="160"
        fixed="right"
      >
        <template #default="scope">
          <el-button v-if="isUpdate" link type="primary" @click="openForm('update', scope.row.id)">
            编辑
          </el-button>
          <el-button v-if="isUpdate" link type="danger" @click="handleDelete(scope.row.id)">
            删除
          </el-button>
          <el-button v-if="isStock" link type="success" @click="handleStock(scope.row.id)">
            上架
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
  </div>

  <!-- 添加/编辑行弹窗 -->
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="物料" prop="itemId">
            <MdItemSelect
              v-model="formData.itemId"
              placeholder="请选择物料"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次编码" prop="batchCode">
            <el-input v-model="formData.batchCode" placeholder="请输入批次编码" />
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

  <!-- 上架明细添加/编辑弹窗 -->
  <ProductRecptDetailForm
    ref="detailFormRef"
    :recpt-id="props.recptId"
    @success="onDetailFormSuccess"
  />
</template>

<script setup lang="ts">
import { WmProductRecptLineApi, WmProductRecptLineVO } from '@/api/mes/wm/productrecpt/line'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import ProductRecptDetailList from './ProductRecptDetailList.vue'
import ProductRecptDetailForm from './ProductRecptDetailForm.vue'

defineOptions({ name: 'ProductRecptLineList' })

const props = defineProps<{
  recptId: number
  formType: string
}>()

const { t } = useI18n()
const message = useMessage()

const isUpdate = computed(() => ['create', 'update'].includes(props.formType))
const isStock = computed(() => props.formType === 'stock')

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<WmProductRecptLineVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  recptId: undefined as number | undefined
})

/** 查询行列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.recptId = props.recptId
    const data = await WmProductRecptLineApi.getProductRecptLinePage(queryParams)
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
    await WmProductRecptLineApi.deleteProductRecptLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const lineFormType = ref('')
const formData = ref({
  id: undefined,
  recptId: undefined as number | undefined,
  itemId: undefined,
  quantity: undefined,
  batchId: undefined,
  batchCode: undefined,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '入库数量不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加物料入库单行' : '修改物料入库单行'
  lineFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmProductRecptLineApi.getProductRecptLine(id)
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
    const data = { ...formData.value, recptId: props.recptId } as unknown as WmProductRecptLineVO
    if (lineFormType.value === 'create') {
      await WmProductRecptLineApi.createProductRecptLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmProductRecptLineApi.updateProductRecptLine(data)
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
    recptId: undefined,
    itemId: undefined,
    quantity: undefined,
    batchId: undefined,
    batchCode: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

// ==================== 展开行：上架明细 ====================
const detailListRefs = ref<Record<number, InstanceType<typeof ProductRecptDetailList>>>({})

/** 缓存子组件 ref */
const setDetailListRef = (lineId: number, el: any) => {
  if (el) {
    detailListRefs.value[lineId] = el
  }
}

// ==================== 上架明细表单（LineList 层级持有） ====================
const detailFormRef = ref()

/** 上架：直接打开明细创建表单 */
const handleStock = (lineId: number) => {
  const row = list.value.find((r) => r.id === lineId)
  openDetailForm('create', lineId, row?.itemId)
}

/** 打开上架明细表单 */
const openDetailForm = (type: string, lineId: number, itemId?: number, detailId?: number) => {
  detailFormRef.value.open(type, lineId, itemId, detailId)
}

/** 明细表单提交成功后，刷新已展开行的 DetailList */
const onDetailFormSuccess = (lineId: number) => {
  detailListRefs.value[lineId]?.getList()
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
