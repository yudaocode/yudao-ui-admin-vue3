<!-- MES 生产工单表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="工单编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入工单编码" :disabled="isDetail">
              <template #append>
                <el-button @click="generateCode" :disabled="formType === 'update' || isDetail">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工单名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入工单名称" :disabled="isDetail" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="工单来源" prop="orderSourceType">
            <el-select
              v-model="formData.orderSourceType"
              placeholder="请选择工单来源"
              class="!w-1/1"
              :disabled="isDetail"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.orderSourceType === MesProWorkOrderSourceTypeEnum.ORDER">
          <el-form-item label="来源单据编号" prop="orderSourceCode">
            <el-input
              v-model="formData.orderSourceCode"
              placeholder="请输入来源单据编号"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工单类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择工单类型"
              class="!w-1/1"
              :disabled="isDetail"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="产品" prop="productId">
            <MdItemSelect
              v-model="formData.productId"
              :disabled="isDetail"
              @change="handleProductChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工单数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :min="0"
              :precision="2"
              class="!w-1/1"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户" prop="clientId">
            <MdClientSelect v-model="formData.clientId" :disabled="isDetail" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col
          :span="8"
          v-if="
            formData.type === MesProWorkOrderTypeEnum.OUTSOURCE ||
            formData.type === MesProWorkOrderTypeEnum.PURCHASE
          "
        >
          <el-form-item label="供应商" prop="vendorId">
            <MdVendorSelect v-model="formData.vendorId" :disabled="isDetail" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="需求日期" prop="requestDate">
            <el-date-picker
              v-model="formData.requestDate"
              type="date"
              placeholder="请选择需求日期"
              value-format="x"
              class="!w-1/1"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formType !== 'create'">
          <el-form-item label="工单状态" prop="status">
            <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="formData.status" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              type="textarea"
              v-model="formData.remark"
              placeholder="请输入备注"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- BOM Tab：编辑/详情时显示 -->
    <el-tabs v-if="formType !== 'create'" v-model="activeTab" class="mt-15px">
      <el-tab-pane label="工单 BOM" name="bom">
        <WorkOrderBomList
          v-if="formData.id"
          :work-order-id="formData.id"
          :work-order="formData"
          :disabled="isDetail"
          @generate-work-order="handleGenerateWorkOrder"
        />
      </el-tab-pane>
      <el-tab-pane label="物料需求" name="item">
        <WorkOrderItemList v-if="formData.id" :work-order-id="formData.id" />
      </el-tab-pane>
    </el-tabs>
    <template #footer v-if="!isDetail">
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ProWorkOrderApi, ProWorkOrderVO } from '@/api/mes/pro/workorder'
import { MdItemVO } from '@/api/mes/md/item'
import { generateRandomStr } from '@/utils'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import WorkOrderBomList from './WorkOrderBomList.vue'
import WorkOrderItemList from './WorkOrderItemList.vue'
import { MesProWorkOrderSourceTypeEnum, MesProWorkOrderTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'WorkOrderForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const activeTab = ref('bom') // 活跃的 Tab
const formData = ref({
  id: undefined,
  parentId: undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  orderSourceType: undefined,
  orderSourceCode: undefined,
  productId: undefined,
  unitMeasureId: undefined,
  quantity: undefined,
  clientId: undefined,
  vendorId: undefined,
  requestDate: undefined,
  status: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '工单编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '工单名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '工单类型不能为空', trigger: 'change' }],
  orderSourceType: [{ required: true, message: '工单来源不能为空', trigger: 'change' }],
  productId: [{ required: true, message: '产品不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '工单数量不能为空', trigger: 'blur' }],
  requestDate: [{ required: true, message: '需求日期不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 是否为详情模式 */
const isDetail = computed(() => formType.value === 'detail')

/** 生成工单编码 */
const generateCode = () => {
  formData.value.code = 'MO' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number, parentRow?: any) => {
  dialogVisible.value = true
  dialogTitle.value = parentRow ? '新增子工单' : type === 'detail' ? '工单详情' : t('action.' + type)
  formType.value = type
  activeTab.value = 'bom'
  resetForm()
  // 修改/详情时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProWorkOrderApi.getWorkOrder(id)
    } finally {
      formLoading.value = false
    }
  }
  // 新增子工单时，预填父工单信息
  if (parentRow) {
    formData.value.parentId = parentRow.id
    formData.value.type = parentRow.type
    formData.value.orderSourceType = parentRow.orderSourceType
    formData.value.orderSourceCode = parentRow.orderSourceCode
    formData.value.clientId = parentRow.clientId
    formData.value.vendorId = parentRow.vendorId
    formData.value.requestDate = parentRow.requestDate
  }
}

/** 从 BOM 行生成子工单 */
const handleGenerateWorkOrder = (bomRow: any) => {
  // 保存当前工单信息
  const currentWorkOrder = { ...formData.value }
  resetForm()
  // 设置弹窗状态
  dialogTitle.value = '新增子工单'
  formType.value = 'create'
  activeTab.value = 'bom'
  // 预填父工单信息 + BOM 物料作为产品
  formData.value.parentId = currentWorkOrder.id
  formData.value.type = currentWorkOrder.type
  formData.value.orderSourceType = currentWorkOrder.orderSourceType
  formData.value.orderSourceCode = currentWorkOrder.orderSourceCode
  formData.value.clientId = currentWorkOrder.clientId
  formData.value.vendorId = currentWorkOrder.vendorId
  formData.value.requestDate = currentWorkOrder.requestDate
  formData.value.productId = bomRow.itemId
  formData.value.unitMeasureId = bomRow.unitMeasureId
  formData.value.quantity = bomRow.quantity
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 产品变更：自动填充单位 */
const handleProductChange = (product: MdItemVO) => {
  if (product?.unitMeasureId) {
    formData.value.unitMeasureId = product.unitMeasureId
  }
}

/** 工单来源变更：非客户订单时清空来源单据编号 */
watch(
  () => formData.value.orderSourceType,
  (val) => {
    if (val !== MesProWorkOrderSourceTypeEnum.ORDER) {
      formData.value.orderSourceCode = undefined
    }
  }
)

/** 工单类型变更：非代工/采购时清空供应商 */
watch(
  () => formData.value.type,
  (val) => {
    if (val !== MesProWorkOrderTypeEnum.OUTSOURCE && val !== MesProWorkOrderTypeEnum.PURCHASE) {
      formData.value.vendorId = undefined
    }
  }
)

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProWorkOrderVO
    if (formType.value === 'create') {
      await ProWorkOrderApi.createWorkOrder(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProWorkOrderApi.updateWorkOrder(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    parentId: undefined,
    code: undefined,
    name: undefined,
    type: undefined,
    orderSourceType: undefined,
    orderSourceCode: undefined,
    productId: undefined,
    unitMeasureId: undefined,
    quantity: undefined,
    clientId: undefined,
    vendorId: undefined,
    requestDate: undefined,
    status: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
