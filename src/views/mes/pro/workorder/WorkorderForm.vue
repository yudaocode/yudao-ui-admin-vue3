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
            <el-input v-model="formData.code" placeholder="请输入工单编码" :disabled="isDetail" />
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
          <el-form-item label="来源类型" prop="orderSourceType">
            <el-select
              v-model="formData.orderSourceType"
              placeholder="请选择来源类型"
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
        <el-col :span="8">
          <el-form-item label="来源单据编号" prop="orderSourceCode">
            <el-input
              v-model="formData.orderSourceCode"
              placeholder="请输入来源单据编号"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="产品" prop="productId">
            <el-select
              v-model="formData.productId"
              placeholder="请选择产品"
              filterable
              class="!w-1/1"
              :disabled="isDetail"
              @change="handleProductChange"
            >
              <el-option
                v-for="item in productList"
                :key="item.id"
                :label="item.name + (item.code ? ' (' + item.code + ')' : '')"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="单位" prop="unitMeasureId">
            <el-select
              v-model="formData.unitMeasureId"
              placeholder="请选择单位"
              filterable
              class="!w-1/1"
              :disabled="isDetail"
            >
              <el-option
                v-for="item in unitMeasureList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :min="0"
              :precision="2"
              class="!w-1/1"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="客户" prop="clientId">
            <el-select
              v-model="formData.clientId"
              placeholder="请选择客户"
              filterable
              clearable
              class="!w-1/1"
              :disabled="isDetail"
            >
              <el-option
                v-for="item in clientList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商" prop="vendorId">
            <el-select
              v-model="formData.vendorId"
              placeholder="请选择供应商"
              filterable
              clearable
              class="!w-1/1"
              :disabled="isDetail"
            >
              <el-option
                v-for="item in vendorList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次号" prop="batchCode">
            <el-input
              v-model="formData.batchCode"
              placeholder="请输入批次号"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="需求日期" prop="requestDate">
            <el-date-picker
              v-model="formData.requestDate"
              type="datetime"
              placeholder="请选择需求日期"
              value-format="x"
              class="!w-1/1"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工单状态" prop="status" v-if="formType !== 'create'">
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
        <WorkOrderBom v-if="formData.id" :work-order-id="formData.id" :disabled="isDetail" />
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
import { MdItemApi, MdItemVO } from '@/api/mes/md/item'
import { MdClientApi } from '@/api/mes/md/client'
import { MdVendorApi } from '@/api/mes/md/vendor'
import { MdUnitMeasureApi } from '@/api/mes/md/unitmeasure'
import WorkOrderBom from './WorkOrderBom.vue'

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
  batchCode: undefined,
  requestDate: undefined,
  status: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '工单编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '工单名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '工单类型不能为空', trigger: 'change' }],
  orderSourceType: [{ required: true, message: '来源类型不能为空', trigger: 'change' }],
  productId: [{ required: true, message: '产品不能为空', trigger: 'change' }],
  unitMeasureId: [{ required: true, message: '单位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '生产数量不能为空', trigger: 'blur' }],
  requestDate: [{ required: true, message: '需求日期不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

// 关联数据列表
const productList = ref<MdItemVO[]>([]) // 产品列表
const clientList = ref<any[]>([]) // 客户列表
const vendorList = ref<any[]>([]) // 供应商列表
const unitMeasureList = ref<any[]>([]) // 计量单位列表

/** 是否为详情模式 */
const isDetail = computed(() => formType.value === 'detail')

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'detail' ? '工单详情' : t('action.' + type)
  formType.value = type
  activeTab.value = 'bom'
  resetForm()
  // 加载关联数据
  productList.value = await MdItemApi.getItemSimpleList()
  clientList.value = await MdClientApi.getClientSimpleList()
  vendorList.value = await MdVendorApi.getVendorSimpleList()
  unitMeasureList.value = await MdUnitMeasureApi.getUnitMeasureSimpleList()
  // 修改/详情时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProWorkOrderApi.getWorkOrder(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 产品变更：自动填充单位 */
const handleProductChange = (productId: number) => {
  const product = productList.value.find((item) => item.id === productId)
  if (product && product.unitMeasureId) {
    formData.value.unitMeasureId = product.unitMeasureId
  }
}

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
    batchCode: undefined,
    requestDate: undefined,
    status: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
