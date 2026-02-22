<!-- MES 采购入库单行列表子组件 -->
<template>
  <div>
    <el-button v-if="!isReadonly" type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加物料
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="入库数量" align="center" prop="receivedQuantity" width="100" />
      <el-table-column
        label="生产批号"
        align="center"
        prop="productionBatchNumber"
        min-width="120"
      />
      <el-table-column v-if="!isReadonly" label="操作" align="center" width="120" fixed="right">
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
        <el-col :span="12">
          <el-form-item label="物料" prop="itemId">
            <!-- TODO 物料的 select 组件 -->
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
        <!-- TODO @AI：此时不需要这个字段！ -->
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <WmWarehouseSelect v-model="formData.warehouseId" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产批号" prop="productionBatchNumber">
            <el-input v-model="formData.productionBatchNumber" placeholder="请输入生产批号" />
          </el-form-item>
        </el-col>
        <!-- TODO @芋艿：可能不需要这个字段，界面上没有。【待定】 -->
        <el-col :span="8">
          <el-form-item label="是否检验" prop="iqcCheckFlag">
            <el-switch v-model="formData.iqcCheckFlag" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="生产日期" prop="productionDate">
            <el-date-picker
              v-model="formData.productionDate"
              type="date"
              value-format="x"
              placeholder="请选择"
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
              placeholder="请选择"
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
    <!-- 编辑时展示上架明细 -->
    <template v-if="formData.id">
      <el-divider content-position="center">上架明细</el-divider>
      <ItemReceiptDetailList
        :receipt-id="props.receiptId"
        :line-id="formData.id"
        :form-type="props.formType"
      />
    </template>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmItemReceiptLineApi, WmItemReceiptLineVO } from '@/api/mes/wm/itemreceipt/line'
import { MdItemApi } from '@/api/mes/md/item'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import ItemReceiptDetailList from './ItemReceiptDetailList.vue'

defineOptions({ name: 'ItemReceiptLineList' })

const props = defineProps<{
  receiptId: number
  formType: string
}>()

/** 行列表在 shelving/execute/detail 模式下只读 */
const isReadonly = computed(() =>
  ['shelving', 'execute', 'detail'].includes(props.formType)
)

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

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
const itemList = ref<any[]>([]) // 物料列表
const formData = ref({
  id: undefined,
  receiptId: undefined as number | undefined,
  itemId: undefined,
  receivedQuantity: undefined,
  warehouseId: undefined,
  locationId: undefined,
  areaId: undefined,
  batchId: undefined,
  productionDate: undefined,
  expireDate: undefined,
  productionBatchNumber: undefined,
  iqcCheckFlag: false,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  receivedQuantity: [{ required: true, message: '入库数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  lineFormType.value = type
  resetForm()
  // 加载物料列表
  itemList.value = await MdItemApi.getItemSimpleList()
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
    itemId: undefined,
    receivedQuantity: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    batchId: undefined,
    productionDate: undefined,
    expireDate: undefined,
    productionBatchNumber: undefined,
    iqcCheckFlag: false,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
