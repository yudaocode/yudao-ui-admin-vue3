<!-- MES 采购入库单行列表子组件 -->
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
          <ItemReceiptDetailList
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
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="入库数量" align="center" prop="receivedQuantity" width="100" />
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
        <el-col :span="8" v-if="hasNoticeId">
          <el-form-item label="到货通知单行" prop="arrivalNoticeLineId">
            <WmArrivalNoticeLineSelect
              v-model="formData.arrivalNoticeLineId"
              :notice-id="props.noticeId"
              @change="handleNoticeLineChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="物料" prop="itemId">
            <MdItemSelect
              v-model="formData.itemId"
              placeholder="请选择物料"
              class="!w-1/1"
              :disabled="!!formData.arrivalNoticeLineId"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库数量" prop="receivedQuantity">
            <el-input-number
              v-model="formData.receivedQuantity"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <!-- TODO @AI：生产批号，改成 lotNumber；前后端，数据库实体；所有代码里，涉及到的，都需要修改下； -->
        <el-col :span="8">
          <el-form-item label="生产批号" prop="productionBatchNumber">
            <el-input v-model="formData.productionBatchNumber" placeholder="请输入生产批号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <!-- TODO @AI：请输入批次号，改成“由填写信息自动生成”；然后后端的 VO 也不用接收这个参数； -->
          <el-form-item label="批次号" prop="batchCode">
            <el-input v-model="formData.batchCode" placeholder="请输入批次号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产日期" prop="productionDate">
            <el-date-picker
              v-model="formData.productionDate"
              type="date"
              value-format="x"
              placeholder="请选择生产日期"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="有效期" prop="expireDate">
            <el-date-picker
              v-model="formData.expireDate"
              type="date"
              value-format="x"
              placeholder="请选择有效期"
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

  <!-- 上架明细添加/编辑弹窗 -->
  <ItemReceiptDetailForm
    ref="detailFormRef"
    :receipt-id="props.receiptId"
    @success="onDetailFormSuccess"
  />
</template>

<script setup lang="ts">
import { WmItemReceiptLineApi, WmItemReceiptLineVO } from '@/api/mes/wm/itemreceipt/line'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import WmArrivalNoticeLineSelect from '@/views/mes/wm/arrivalnotice/components/WmArrivalNoticeLineSelect.vue'
import ItemReceiptDetailList from './ItemReceiptDetailList.vue'
import ItemReceiptDetailForm from './ItemReceiptDetailForm.vue'

defineOptions({ name: 'ItemReceiptLineList' })

const props = defineProps<{
  receiptId: number
  noticeId?: number
  formType: string
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const isUpdate = computed(() => ['create', 'update'].includes(props.formType)) // 是否为编辑模式
const isStock = computed(() => props.formType === 'stock') // 是否为上架模式

// ==================== 列表 ====================
const loading = ref(false) // 列表的加载中
const list = ref<WmItemReceiptLineVO[]>([]) // 行列表
const total = ref(0) // 列表的总页数
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
    const data = await WmItemReceiptLineApi.getItemReceiptLinePage(queryParams)
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
    await WmItemReceiptLineApi.deleteItemReceiptLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const lineFormType = ref('') // 行表单的类型
const hasNoticeId = computed(() => !!props.noticeId) // 是否有到货通知单
const formData = ref({
  id: undefined,
  receiptId: undefined as number | undefined,
  arrivalNoticeLineId: undefined,
  itemId: undefined,
  receivedQuantity: undefined,
  batchId: undefined,
  batchCode: undefined,
  productionDate: undefined,
  expireDate: undefined,
  productionBatchNumber: undefined,
  remark: undefined
})
const formRules = reactive({
  arrivalNoticeLineId: [{ required: true, message: '到货通知单行不能为空', trigger: 'change' }],
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  receivedQuantity: [{ required: true, message: '入库数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 到货通知单行变化时，自动填充物料信息 */
const handleNoticeLineChange = (line: any) => {
  if (line) {
    formData.value.itemId = line.itemId
    formData.value.receivedQuantity = line.arrivalQuantity
  }
}

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加物料入库单行' : '修改物料入库单行'
  lineFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmItemReceiptLineApi.getItemReceiptLine(id)
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
    const data = { ...formData.value, receiptId: props.receiptId } as unknown as WmItemReceiptLineVO
    if (lineFormType.value === 'create') {
      await WmItemReceiptLineApi.createItemReceiptLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmItemReceiptLineApi.updateItemReceiptLine(data)
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
    arrivalNoticeLineId: undefined,
    itemId: undefined,
    receivedQuantity: undefined,
    batchId: undefined,
    batchCode: undefined,
    productionDate: undefined,
    expireDate: undefined,
    productionBatchNumber: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

// ==================== 展开行：上架明细 ====================
const detailListRefs = ref<Record<number, InstanceType<typeof ItemReceiptDetailList>>>({})

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
