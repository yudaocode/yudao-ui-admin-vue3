<!-- MES 发货通知单行列表子组件 -->
<template>
  <div class="overflow-hidden">
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
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="发货数量" align="center" prop="quantity" width="100" />
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column label="是否检验" align="center" prop="oqcCheckFlag" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.oqcCheckFlag" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      <el-table-column
        v-if="isUpdate"
        label="操作"
        align="center"
        width="120"
        fixed="right"
      >
        <template #default="scope">
          <el-button v-if="isUpdate" link type="primary" @click="openForm('update', scope.row.id)">
            编辑
          </el-button>
          <el-button v-if="isUpdate" link type="danger" @click="handleDelete(scope.row.id)">
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
          <el-form-item label="库存记录" prop="materialStockId">
            <WmMaterialStockSelect
              v-model="formData.materialStockId"
              placeholder="请选择库存"
              class="!w-1/1"
              @change="handleStockChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发货数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0"
              :max="quantityMax"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次号">
            <el-input :model-value="formData.batchCode" disabled placeholder="选择库存后自动带出" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="物料">
            <MdItemSelect v-model="formData.itemId" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否检验" prop="oqcCheckFlag">
            <el-switch v-model="formData.oqcCheckFlag" />
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
import { DICT_TYPE } from '@/utils/dict'
import { WmSalesNoticeLineApi, WmSalesNoticeLineVO } from '@/api/mes/wm/salesnotice/line'
import { WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import WmMaterialStockSelect from '@/views/mes/wm/materialstock/components/WmMaterialStockSelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'

defineOptions({ name: 'SalesNoticeLineList' })

const props = defineProps<{
  noticeId: number
  formType: string
}>()

const { t } = useI18n()
const message = useMessage()

const isUpdate = computed(() => ['create', 'update'].includes(props.formType))

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<WmSalesNoticeLineVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  noticeId: undefined as number | undefined
})

/** 查询行列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.noticeId = props.noticeId
    const data = await WmSalesNoticeLineApi.getSalesNoticeLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmSalesNoticeLineApi.deleteSalesNoticeLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const lineFormType = ref('')
const quantityMax = ref<number | undefined>(undefined)
const formData = ref({
  id: undefined,
  noticeId: undefined as number | undefined,
  materialStockId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  quantity: undefined as number | undefined,
  batchId: undefined as number | undefined,
  batchCode: undefined as string | undefined,
  oqcCheckFlag: true,
  remark: undefined
})
const formRules = reactive({
  materialStockId: [{ required: true, message: '请选择库存记录', trigger: 'change' }],
  quantity: [{ required: true, message: '发货数量不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 库存选中回调 —— 自动回填物料ID/批次/数量上限 */
const handleStockChange = (stock: WmMaterialStockVO | undefined) => {
  if (!stock) {
    formData.value.itemId = undefined
    formData.value.batchId = undefined
    formData.value.batchCode = undefined
    formData.value.quantity = undefined
    quantityMax.value = undefined
    return
  }
  formData.value.itemId = stock.itemId
  formData.value.batchId = stock.batchId
  formData.value.batchCode = stock.batchCode
  formData.value.quantity = stock.quantity
  quantityMax.value = stock.quantity
}

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加发货通知单行' : '修改发货通知单行'
  lineFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmSalesNoticeLineApi.getSalesNoticeLine(id)
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
    const data = { ...formData.value, noticeId: props.noticeId } as unknown as WmSalesNoticeLineVO
    if (lineFormType.value === 'create') {
      await WmSalesNoticeLineApi.createSalesNoticeLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmSalesNoticeLineApi.updateSalesNoticeLine(data)
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
    noticeId: undefined,
    materialStockId: undefined,
    itemId: undefined,
    quantity: undefined,
    batchId: undefined,
    batchCode: undefined,
    oqcCheckFlag: true,
    remark: undefined
  }
  quantityMax.value = undefined
  formRef.value?.resetFields()
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
