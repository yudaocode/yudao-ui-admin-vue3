<!-- MES 委外收货单行列表子组件 -->
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
          <OutsourceReceiptDetailList
            :ref="(el: any) => setDetailListRef(scope.row.id, el)"
            :receipt-id="props.receiptId"
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
      <!-- TODO @AI：规格型号； -->
      <el-table-column label="单位" align="center" prop="unitName" width="80" />
      <el-table-column label="收货数量" align="center" prop="quantity" width="100" />
      <!-- TODO @AI：批次号 -->
      <!-- TODO @AI：是否检验 -->
      <!-- TODO @AI：质量状态 -->
      <el-table-column
        v-if="isUpdate"
        label="操作"
        align="center"
        width="160"
        fixed="right"
      >
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">
            删除
          </el-button>
          <!-- TODO @芋艿：标签打印； -->
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
          <el-form-item label="收货数量" prop="quantity">
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

  <!-- 收货明细添加/编辑弹窗 -->
  <OutsourceReceiptDetailForm
    ref="detailFormRef"
    :receipt-id="props.receiptId"
    @success="onDetailFormSuccess"
  />
</template>

<script setup lang="ts">
import { WmOutsourceReceiptLineApi, WmOutsourceReceiptLineVO } from '@/api/mes/wm/outsourcereceipt/line'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import OutsourceReceiptDetailList from './OutsourceReceiptDetailList.vue'
import OutsourceReceiptDetailForm from './OutsourceReceiptDetailForm.vue'

defineOptions({ name: 'OutsourceReceiptLineList' })

const props = defineProps<{
  receiptId: number
  formType: string
}>()

const { t } = useI18n()
const message = useMessage()

const isUpdate = computed(() => ['create', 'update'].includes(props.formType))

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<WmOutsourceReceiptLineVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  receiptId: undefined as number | undefined
})

/** 查询行列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.receiptId = props.receiptId
    const data = await WmOutsourceReceiptLineApi.getOutsourceReceiptLinePage(queryParams)
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
    await WmOutsourceReceiptLineApi.deleteOutsourceReceiptLine(id)
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
  receiptId: undefined as number | undefined,
  itemId: undefined,
  quantity: undefined,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '收货数量不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加委外收货单行' : '修改委外收货单行'
  lineFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmOutsourceReceiptLineApi.getOutsourceReceiptLine(id)
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
    const data = { ...formData.value, receiptId: props.receiptId } as unknown as WmOutsourceReceiptLineVO
    if (lineFormType.value === 'create') {
      await WmOutsourceReceiptLineApi.createOutsourceReceiptLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmOutsourceReceiptLineApi.updateOutsourceReceiptLine(data)
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
    receiptId: undefined,
    itemId: undefined,
    quantity: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

// ==================== 展开行：收货明细 ====================
const detailListRefs = ref<Record<number, InstanceType<typeof OutsourceReceiptDetailList>>>({})

/** 缓存子组件 ref */
const setDetailListRef = (lineId: number, el: any) => {
  if (el) {
    detailListRefs.value[lineId] = el
  }
}

// ==================== 收货明细表单 ====================
const detailFormRef = ref()

/** 打开收货明细表单 */
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
